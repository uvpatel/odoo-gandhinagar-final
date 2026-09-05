import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname.startsWith("/signin") || pathname.startsWith("/signup");
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/employees") ||
    pathname.startsWith("/contracts") ||
    pathname.startsWith("/time-off") ||
    pathname.startsWith("/payroll") ||
    pathname.startsWith("/attendance") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/admin");

  if (!isAuthRoute && !isProtectedRoute) {
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
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  // Role-based route access controls
  if (session && isProtectedRoute) {
    const userRole = (session.user as { role?: string })?.role || "employee";

    // Administration routes: only Admin
    if (pathname.startsWith("/admin") && userRole !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

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