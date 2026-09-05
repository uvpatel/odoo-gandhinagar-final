import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { users, employees, departments, jobPositions, accounts, sessions } from "@/db/schema";
import { requirePermission, AuthorizationError } from "@/lib/auth/authorization";
import { hashPassword } from "better-auth/crypto";
import { eq, sql, desc, asc, ilike, and, or, isNull, isNotNull } from "drizzle-orm";
import { normalizeRole, type AppRole } from "@/lib/auth/permissions";

export async function GET(request: NextRequest) {
  try {
    await requirePermission("administration", "manage-users", request.headers);

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const roleFilter = searchParams.get("role")?.trim();
    const statusFilter = searchParams.get("status")?.trim();

    const conditions = [];

    if (roleFilter && roleFilter !== "all") {
      if (roleFilter === "payroll_manager") {
        conditions.push(or(eq(users.role, "payroll_manager"), eq(users.role, "hr_payroll_manager")));
      } else if (roleFilter === "payroll_user") {
        conditions.push(or(eq(users.role, "payroll_user"), eq(users.role, "hr_payroll_user")));
      } else {
        conditions.push(eq(users.role, roleFilter as any));
      }
    }

    if (statusFilter && statusFilter !== "all") {
      if (statusFilter === "active") {
        conditions.push(sql`${users.banned} = false OR ${users.banned} IS NULL`);
      } else if (statusFilter === "banned") {
        conditions.push(eq(users.banned, true));
      } else if (statusFilter === "linked") {
        conditions.push(isNotNull(employees.id));
      } else if (statusFilter === "unlinked") {
        conditions.push(isNull(employees.id));
      }
    }

    if (q) {
      const search = `%${q}%`;
      conditions.push(
        or(
          ilike(users.name, search),
          ilike(users.email, search),
          ilike(employees.employeeNumber, search),
          ilike(employees.firstName, search),
          ilike(employees.lastName, search)
        )
      );
    }

    const userList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        emailVerified: users.emailVerified,
        image: users.image,
        role: users.role,
        banned: users.banned,
        banReason: users.banReason,
        banExpires: users.banExpires,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        employeeId: employees.id,
        employeeNumber: employees.employeeNumber,
        employeeFirstName: employees.firstName,
        employeeLastName: employees.lastName,
        employeeWorkEmail: employees.workEmail,
        employeeStatus: employees.status,
        departmentId: departments.id,
        departmentName: departments.name,
        jobPositionId: jobPositions.id,
        jobTitle: jobPositions.title,
      })
      .from(users)
      .leftJoin(employees, eq(users.id, employees.userId))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(jobPositions, eq(employees.jobPositionId, jobPositions.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(users.createdAt));

    // Also fetch unlinked employees so UI can populate linking modal
    const unlinkedEmployees = await db
      .select({
        id: employees.id,
        employeeNumber: employees.employeeNumber,
        firstName: employees.firstName,
        lastName: employees.lastName,
        fullName: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`.as("full_name"),
        workEmail: employees.workEmail,
        departmentName: departments.name,
        jobTitle: jobPositions.title,
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(jobPositions, eq(employees.jobPositionId, jobPositions.id))
      .where(isNull(employees.userId))
      .orderBy(asc(employees.firstName));

    const formattedUsers = userList.map((u) => {
      let normRole = normalizeRole(u.role);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        emailVerified: u.emailVerified,
        image: u.image,
        role: normRole,
        banned: Boolean(u.banned),
        banReason: u.banReason,
        banExpires: u.banExpires,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        employee: u.employeeId
          ? {
              id: u.employeeId,
              employeeNumber: u.employeeNumber,
              firstName: u.employeeFirstName,
              lastName: u.employeeLastName,
              fullName: `${u.employeeFirstName} ${u.employeeLastName}`,
              workEmail: u.employeeWorkEmail,
              departmentName: u.departmentName,
              jobTitle: u.jobTitle,
              status: u.employeeStatus,
            }
          : null,
      };
    });

    return NextResponse.json({
      data: {
        users: formattedUsers,
        unlinkedEmployees,
      },
    });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to fetch users" },
      { status }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission("administration", "manage-users", request.headers);

    const body = await request.json();
    const { name, email, role = "employee", password, employeeId } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "User name is required" }, { status: 400 });
    }

    if (!email || !email.trim() || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email already exists
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: `A user with email ${cleanEmail} already exists` },
        { status: 400 }
      );
    }

    const userPassword = password && password.length >= 8 ? password : "Password123!";
    const hashedPassword = await hashPassword(userPassword);
    const userId = crypto.randomUUID();

    const normRole = normalizeRole(role);

    // Insert user
    const [newUser] = await db
      .insert(users)
      .values({
        id: userId,
        name: name.trim(),
        email: cleanEmail,
        emailVerified: true,
        role: normRole as any,
        banned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Insert credentials account for login
    await db.insert(accounts).values({
      id: `acc_${userId}`,
      accountId: userId,
      providerId: "credential",
      userId: userId,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Optionally link to employee record
    if (employeeId) {
      // Unlink any prior link for this employee
      await db
        .update(employees)
        .set({ userId: userId, updatedAt: new Date() })
        .where(eq(employees.id, employeeId));
    }

    return NextResponse.json(
      {
        data: newUser,
        message: "User created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requirePermission("administration", "manage-users", request.headers);
    const currentUserId = session.user.id;

    const body = await request.json();
    const { userId, role, banned, banReason, employeeId } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Safety checks against self-lockout
    if (userId === currentUserId) {
      if (banned === true) {
        return NextResponse.json(
          { error: "You cannot deactivate or ban your own administrator account." },
          { status: 400 }
        );
      }
      if (role && role !== "admin") {
        return NextResponse.json(
          { error: "You cannot remove your own administrator role." },
          { status: 400 }
        );
      }
    }

    const updates: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (role !== undefined) {
      updates.role = normalizeRole(role);
    }

    if (banned !== undefined) {
      updates.banned = Boolean(banned);
      updates.banReason = banned ? (banReason?.trim() || "Deactivated by administrator") : null;
    }

    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Employee link / unlink management
    if (employeeId !== undefined) {
      if (employeeId === null || employeeId === "unlink" || employeeId === "") {
        // Unlink employee currently attached to this user
        await db
          .update(employees)
          .set({ userId: null, updatedAt: new Date() })
          .where(eq(employees.userId, userId));
      } else {
        // Unlink any existing link first
        await db
          .update(employees)
          .set({ userId: null, updatedAt: new Date() })
          .where(eq(employees.userId, userId));

        // Link the specified employee
        await db
          .update(employees)
          .set({ userId: userId, updatedAt: new Date() })
          .where(eq(employees.id, employeeId));
      }
    }

    return NextResponse.json({
      data: updatedUser,
      message: "User updated successfully",
    });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requirePermission("administration", "manage-users", request.headers);
    const currentUserId = session.user.id;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Safeguard: Do not allow deleting self
    if (id === currentUserId) {
      return NextResponse.json(
        { error: "You cannot delete your own account." },
        { status: 400 }
      );
    }

    // 1. Unlink any employee
    await db
      .update(employees)
      .set({ userId: null, updatedAt: new Date() })
      .where(eq(employees.userId, id));

    // 2. Delete active sessions
    await db.delete(sessions).where(eq(sessions.userId, id));

    // 3. Delete credentials/accounts
    await db.delete(accounts).where(eq(accounts.userId, id));

    // 4. Delete user record
    await db.delete(users).where(eq(users.id, id));

    return NextResponse.json({
      message: "User deleted successfully",
    });
  } catch (error: any) {
    const status = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json(
      { error: error.message || "Failed to delete user" },
      { status }
    );
  }
}
