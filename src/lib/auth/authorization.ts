import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/index";
import { employees, users, departments, jobPositions, workingSchedules } from "@/db/schema";
import { eq, ilike, sql, or } from "drizzle-orm";
import {
  hasPermission,
  normalizeRole,
  type AppRole,
  type ResourceName,
  type ActionName,
} from "./permissions";

export type AuthSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export class AuthorizationError extends Error {
  status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.name = "AuthorizationError";
    this.status = status;
  }
}

/**
 * Server-side helper to retrieve the authenticated session.
 * Supports optional explicit headers (e.g., in Next.js Route Handlers).
 */
export async function getAuthSession(customHeaders?: Headers): Promise<AuthSession | null> {
  try {
    const reqHeaders = customHeaders || (await headers());
    const session = await auth.api.getSession({
      headers: reqHeaders,
    });
    return session as AuthSession | null;
  } catch (error: any) {
    if (error?.digest === "DYNAMIC_SERVER_USAGE" || error?.message?.includes("Dynamic server usage")) {
      throw error;
    }
    console.error("Error retrieving auth session:", error);
    return null;
  }
}

/**
 * Requires a valid session. Throws AuthorizationError(401) if not logged in.
 */
export async function requireAuth(customHeaders?: Headers): Promise<AuthSession> {
  const session = await getAuthSession(customHeaders);
  if (!session || !session.user) {
    throw new AuthorizationError("Unauthorized: Authentication required", 401);
  }
  return session;
}

/**
 * Requires that the current user has a specific permission on a resource.
 * Throws AuthorizationError(403) if forbidden.
 */
export async function requirePermission<R extends ResourceName>(
  resource: R,
  action: ActionName<R>,
  customHeaders?: Headers
): Promise<AuthSession> {
  const session = await requireAuth(customHeaders);
  const userRole = normalizeRole((session.user as { role?: string })?.role);

  const allowed = hasPermission(userRole, resource, action);
  if (!allowed) {
    throw new AuthorizationError(
      `Forbidden: Role '${userRole}' lacks permission '${action}' on '${String(resource)}'`,
      403
    );
  }

  return session;
}

/**
 * Retrieves the Employee record linked to the authenticated session user.
 * If no employee record is directly linked to the user ID:
 * 1) Tries to find an existing employee record matching the user's email and links it.
 * 2) If no employee record exists at all for the user, auto-provisions an active employee record
 *    so attendance check-in/out, time-off, and self-service features work seamlessly.
 */
export async function getCurrentEmployee(userId?: string) {
  let sessionUser: { id: string; email?: string | null; name?: string | null } | null = null;
  if (!userId) {
    const session = await getAuthSession();
    if (!session?.user?.id) return null;
    userId = session.user.id;
    sessionUser = session.user as any;
  }

  // 1. Check for existing employee directly linked by userId
  const [employee] = await db
    .select()
    .from(employees)
    .where(eq(employees.userId, userId))
    .limit(1);

  if (employee) {
    return employee;
  }

  // 2. Fetch the user details to get email and display name
  if (!sessionUser) {
    const [dbUser] = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    sessionUser = dbUser || null;
  }

  if (!sessionUser) {
    return null;
  }

  const cleanEmail = (sessionUser.email || "").trim().toLowerCase();

  // 3. Check if an existing employee record matches by work email
  if (cleanEmail) {
    const [matchingEmp] = await db
      .select()
      .from(employees)
      .where(ilike(employees.workEmail, cleanEmail))
      .limit(1);

    if (matchingEmp) {
      // Auto-link this employee to the user account
      const [linkedEmp] = await db
        .update(employees)
        .set({ userId: sessionUser.id, updatedAt: new Date() })
        .where(eq(employees.id, matchingEmp.id))
        .returning();
      return linkedEmp || matchingEmp;
    }
  }

  // 4. Auto-provision an active employee record for this user account
  const rawName = (sessionUser.name || "").trim();
  const nameParts = rawName ? rawName.split(/\s+/) : ["Employee", "User"];
  const firstName = nameParts[0] || "Employee";
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "User";

  // Assign standard defaults
  const [defaultDept] = await db.select({ id: departments.id }).from(departments).limit(1);
  const [defaultJob] = await db.select({ id: jobPositions.id }).from(jobPositions).limit(1);
  const [defaultSchedule] = await db.select({ id: workingSchedules.id }).from(workingSchedules).limit(1);

  // Generate unique employee number (EMP-XXXX)
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(employees);
  let counter = (countResult?.count || 0) + 1;
  let candidateNum = `EMP-${String(counter).padStart(4, "0")}`;

  while (true) {
    const [exists] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.employeeNumber, candidateNum))
      .limit(1);
    if (!exists) break;
    counter++;
    candidateNum = `EMP-${String(counter).padStart(4, "0")}`;
  }

  const assignedEmail = cleanEmail || `${candidateNum.toLowerCase()}@peoplepay360.com`;

  try {
    const [newEmp] = await db
      .insert(employees)
      .values({
        employeeNumber: candidateNum,
        userId: sessionUser.id,
        firstName,
        lastName,
        workEmail: assignedEmail,
        departmentId: defaultDept?.id || null,
        jobPositionId: defaultJob?.id || null,
        workingScheduleId: defaultSchedule?.id || null,
        employeeType: "full_time",
        status: "active",
        joiningDate: new Date().toISOString().split("T")[0],
      })
      .returning();

    return newEmp;
  } catch (insertError) {
    console.error("Auto-provision employee record encountered error, falling back to query:", insertError);
    const [fallbackEmp] = await db
      .select()
      .from(employees)
      .where(or(eq(employees.userId, userId), ilike(employees.workEmail, assignedEmail)))
      .limit(1);
    return fallbackEmp || null;
  }
}

/**
 * Allows the operation if:
 * 1) The user is acting on their own employee record AND has 'selfAction' permission, OR
 * 2) The user has the company-wide 'generalAction' permission on the resource.
 */
export async function requireSelfOrPermission<R extends ResourceName>(
  resource: R,
  selfAction: ActionName<R>,
  generalAction: ActionName<R>,
  targetEmployeeId: string,
  customHeaders?: Headers
): Promise<{ session: AuthSession; isSelf: boolean }> {
  const session = await requireAuth(customHeaders);
  const userRole = normalizeRole((session.user as { role?: string })?.role);

  const currentEmployee = await getCurrentEmployee(session.user.id);
  const isSelf = Boolean(currentEmployee && currentEmployee.id === targetEmployeeId);

  if (isSelf && hasPermission(userRole, resource, selfAction)) {
    return { session, isSelf: true };
  }

  if (hasPermission(userRole, resource, generalAction)) {
    return { session, isSelf: false };
  }

  throw new AuthorizationError(
    `Forbidden: Insufficient privileges to access resource '${String(resource)}' for employee '${targetEmployeeId}'`,
    403
  );
}
