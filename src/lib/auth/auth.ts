import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/index";
import * as schema from "@/db/schema";
import { admin } from "better-auth/plugins";
import { ac, roles } from "./permissions";

function cleanEnv(val?: string): string {
  if (!val) return "";
  let s = val.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  if (s.startsWith("=")) {
    s = s.slice(1).trim();
  }
  return s;
}

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
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "employee",
        input: false,
      },
    },
  },
  socialProviders: {
    github: {
      clientId: cleanEnv(process.env.GITHUB_CLIENT_ID),
      clientSecret: cleanEnv(process.env.GITHUB_CLIENT_SECRET),
    },
    google: {
      clientId: cleanEnv(process.env.GOOGLE_CLIENT_ID),
      clientSecret: cleanEnv(process.env.GOOGLE_CLIENT_SECRET),
    },
  },
  plugins: [
    admin({
      defaultRole: "employee",
      adminRoles: ["admin"],
      roles,
      ac,
    }),
  ],
});
