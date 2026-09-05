import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/index";
import * as schema from "@/db/schema";
import { organization } from "better-auth/plugins";
import {
  ac,
  employeeRole,
  hrManagerRole,
  payrollUserRole,
  payrollManagerRole,
  adminRole,
} from "@/lib/permissions";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
  plugins: [
    organization({
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
