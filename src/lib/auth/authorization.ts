import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/index";
import { employees } from "@/db/schema";
import { eq } from "drizzle-orm";
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
 */
export async function getCurrentEmployee(userId?: string) {
  if (!userId) {
    const session = await getAuthSession();
    if (!session?.user?.id) return null;
    userId = session.user.id;
  }

  const [employee] = await db
    .select()
    .from(employees)
    .where(eq(employees.userId, userId))
    .limit(1);

  return employee || null;
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
