# Role-Based Access Control (RBAC) in Next.js

Implementing fine-grained authorization, permission matrices, and security guards in Next.js.

---

## 👥 1. Role & Permissions Matrix

Define types and roles clearly in TypeScript:

```typescript
// src/lib/permissions.ts
export type Role = "admin" | "member" | "viewer";

export type Permission =
  | "project:create"
  | "project:read"
  | "project:update"
  | "project:delete"
  | "user:manage"
  | "billing:manage";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    "project:create",
    "project:read",
    "project:update",
    "project:delete",
    "user:manage",
    "billing:manage",
  ],
  member: ["project:create", "project:read", "project:update"],
  viewer: ["project:read"],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
```

---

## 🛡️ 2. Route Protection in Middleware

```typescript
// src/middleware.ts
import { NextResponse, type NextRequest } from "next/navigation";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const pathname = request.nextUrl.pathname;

  // Protect admin routes
  if (pathname.startsWith("/admin") && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/settings/:path*"],
};
```

---

## 🔒 3. Server Action Authorization Guard

Always guard server actions independently of client-side visibility:

```typescript
// src/features/admin/actions/delete-user.ts
"use server";

import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { hasPermission, Role } from "@/lib/permissions";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function deleteUserAction(userId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthenticated");
  }

  const userRole = (session.user as { role?: Role }).role || "viewer";

  if (!hasPermission(userRole, "user:manage")) {
    throw new Error("Forbidden: Insufficient permissions to delete users");
  }

  await db.delete(users).where(eq(users.id, userId));
  return { success: true };
}
```
