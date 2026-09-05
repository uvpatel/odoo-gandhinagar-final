# Next.js Production Architecture & Project Organization

A robust, enterprise-grade architecture ensures scalability, maintainability, and clean separation of concerns as applications grow.

---

## 📁 Recommended Directory Structure

```
src/
├── app/                        # Next.js App Router (pages, layouts, routes)
│   ├── (auth)/                 # Route group for auth flows
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/            # Route group for authenticated app area
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── api/                    # Route Handlers
│   │   └── webhooks/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page
│   ├── error.tsx               # Root error boundary
│   ├── not-found.tsx           # Global 404 page
│   └── globals.css             # Global styles
│
├── components/                 # Shared UI components
│   ├── ui/                     # Primitives (shadcn/ui, Radix wrappers)
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   └── input.tsx
│   └── shared/                 # Reusable cross-feature UI components
│       ├── navbar.tsx
│       ├── footer.tsx
│       └── data-table.tsx
│
├── features/                   # Domain-driven feature modules
│   ├── auth/
│   │   ├── components/         # Feature-specific UI
│   │   ├── actions/            # Server actions for auth
│   │   ├── services/           # Business logic & queries
│   │   ├── schemas/            # Zod validation schemas
│   │   └── types.ts            # Type definitions
│   └── billing/
│       ├── components/
│       ├── actions/
│       └── services/
│
├── server/                     # Server-only infrastructure and data access
│   ├── db/                     # Database setup & schema
│   │   ├── index.ts            # DB connection client
│   │   └── schema.ts           # Drizzle / Mongoose schema definitions
│   └── auth/                   # Auth configuration (Better Auth / NextAuth)
│       └── index.ts
│
├── lib/                        # General utilities & library wrappers
│   ├── utils.ts                # cn() and general helpers
│   ├── env.ts                  # Type-safe validated environment variables
│   └── constants.ts            # App constants
│
├── hooks/                      # Custom React hooks (client-side)
│   ├── use-debounce.ts
│   └── use-media-query.ts
│
└── types/                      # Global TypeScript definitions
    └── index.ts
```

---

## 🔒 Type-Safe Environment Variables

Never access `process.env` directly in application code without validation. Use `@t3-oss/env-nextjs` or a custom Zod schema:

```typescript
// src/lib/env.ts
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
});
```

---

## 🏗️ Architectural Patterns

### 1. Separation of Data Access & Business Logic
- **Data Access Layer (DAL)**: Pure queries/mutations touching the database directly.
- **Service / Action Layer**: Orchestrates authentication, authorization, business rules, and calls the DAL.
- **Presentation Layer**: Consumes actions or data inside Server Components.

### 2. Server Action Boundary Standard
```typescript
// src/features/projects/actions/create-project.ts
"use server";

import { z } from "zod";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { createProjectInDb } from "../services/project-service";
import { revalidatePath } from "next/cache";

const CreateProjectSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().optional(),
});

export async function createProjectAction(rawInput: unknown) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const validated = CreateProjectSchema.parse(rawInput);
  const project = await createProjectInDb(session.user.id, validated);

  revalidatePath("/dashboard/projects");
  return { success: true, data: project };
}
```
