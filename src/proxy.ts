import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const isAuthRoute = pathname.startsWith("/signin") || pathname.startsWith("/signup");
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/employees") ||
    pathname.startsWith("/contracts") ||
    pathname.startsWith("/time-off") ||
    pathname.startsWith("/payroll");

  // Redirect authenticated users away from signin/signup
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users to signin
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  // Role-based route access controls
  if (session && isProtectedRoute) {
    const userRole = (session.user as { role?: string })?.role || "employee";

    // Payroll routes: only Payroll users/managers and Admin
    if (
      pathname.startsWith("/payroll") &&
      !["admin", "hr_payroll_manager", "hr_payroll_user"].includes(userRole)
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Company employee/contract directory management: only HR and Admin
    if (
      (pathname.startsWith("/employees") || pathname.startsWith("/contracts")) &&
      !["admin", "hr_manager", "hr_payroll_manager", "hr_payroll_user"].includes(userRole)
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/employees/:path*",
    "/contracts/:path*",
    "/time-off/:path*",
    "/payroll/:path*",
    "/signin",
    "/signup",
  ],
};