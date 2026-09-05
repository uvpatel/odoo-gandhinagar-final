# Better Auth Integration Guide for Next.js

Better Auth is the comprehensive, framework-agnostic, and type-safe authentication library designed for modern fullstack TypeScript applications.

---

## 📦 1. Installation

```bash
npm install better-auth
# If using Drizzle ORM
npm install drizzle-orm @neondatabase/serverless
```

---

## ⚙️ 2. Server Configuration

Create the server-side auth instance:

```typescript
// src/server/auth/index.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/server/db";
import * as schema from "@/server/db/schema";
import { env } from "@/lib/env";

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
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.NEXT_PUBLIC_APP_URL,
  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  },
});

export type Session = typeof auth.$Infer.Session;
```

---

## 🌐 3. Route Handler Integration

Mount Better Auth handler in Next.js App Router:

```typescript
// src/app/api/auth/[...all]/route.ts
import { auth } from "@/server/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

---

## 💻 4. Client SDK Setup

```typescript
// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

---

## 🔒 5. Session Verification in Server Components

```tsx
// src/app/(dashboard)/dashboard/page.tsx
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <h1>Welcome back, {session.user.name}!</h1>
      <p>Email: {session.user.email}</p>
    </div>
  );
}
```
