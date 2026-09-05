import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins"
import { organizationClient } from "better-auth/client/plugins"

import {
  ac,
  employeeRole,
  hrManagerRole,
  payrollUserRole,
  payrollManagerRole,
  adminRole,
} from "@/lib/auth/permission"



export const authClient = createAuthClient({
  baseURL:
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
     process.env.BETTER_AUTH_URL  ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"),
    plugins: [
    organizationClient({
      ac,

      roles: {
        employee: employeeRole,
        hr_manager: hrManagerRole,
        payroll_user: payrollUserRole,
        payroll_manager: payrollManagerRole,
        admin: adminRole,
      },
    }),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;