import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canAccessRoute, isGuardedRoute } from "@/lib/auth/route-permissions";
import { normalizeRole } from "@/lib/auth/permissions";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname.startsWith("/signin") || pathname.startsWith("/signup");
  const isProtected = isGuardedRoute(pathname);

  if (!isAuthRoute && !isProtected) {
    return NextResponse.next();
  }

  let session = null;
  try {
    session = await auth.api.getSession({
      headers: request.headers,
    });
  } catch (error) {
    console.error("Failed to retrieve auth session in proxy:", error);
  }

  // Redirect authenticated users away from signin/signup
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users to signin
  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  // Role-based route access controls derived from central permissions
  if (session && isProtected) {
    const rawRole = (session.user as { role?: string })?.role;
    const userRole = normalizeRole(rawRole);

    if (!canAccessRoute(pathname, userRole)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/employees/:path*",
    "/contracts/:path*",
    "/time-off/:path*",
    "/payroll/:path*",
    "/attendance/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/signin",
    "/signup",
  ],
};