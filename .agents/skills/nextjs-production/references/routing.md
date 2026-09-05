# Next.js App Router & Advanced Routing Patterns

The Next.js App Router provides file-system based routing with support for layouts, nested routing, parallel routes, intercepting routes, and route handlers.

---

## 📌 Core Routing Conventions

| File | Purpose |
| :--- | :--- |
| `layout.tsx` | Shared UI for a segment and its children; preserves state on navigation. |
| `page.tsx` | Unique UI for a route; makes route publicly accessible. |
| `loading.tsx` | Instant loading UI wrapped in React Suspense boundary. |
| `error.tsx` | Error boundary for segment and its children (must be a Client Component). |
| `not-found.tsx` | 404 UI triggered by `notFound()` or unmatched routes. |
| `route.ts` | Server-side HTTP Route Handler (GET, POST, PUT, DELETE, PATCH). |
| `template.tsx` | Similar to layout, but creates a new instance on navigation (no state preservation). |

---

## 🔀 Route Groups & Layout Isolation

Route groups using `(folderName)` organize routes without affecting the URL path:

```
app/
├── (marketing)/
│   ├── layout.tsx         # Marketing layout (public navbar & footer)
│   ├── page.tsx           # /
│   └── pricing/
│       └── page.tsx       # /pricing
└── (app)/
    ├── layout.tsx         # Dashboard layout (authenticated sidebar & header)
    └── dashboard/
        └── page.tsx       # /dashboard
```

---

## 🔲 Parallel Routes & Modals

Parallel routes allow rendering multiple pages simultaneously in the same layout using named slots (`@slotName`):

```
app/
├── (dashboard)/
│   ├── layout.tsx         # Accepts props: { children, analytics, team }
│   ├── @analytics/
│   │   ├── page.tsx
│   │   └── default.tsx
│   └── @team/
│       ├── page.tsx
│       └── default.tsx
```

```tsx
// app/(dashboard)/layout.tsx
export default function DashboardLayout({
  children,
  analytics,
  team,
}: {
  children: React.ReactNode;
  analytics: React.ReactNode;
  team: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-12 gap-4">
      <main className="col-span-8">{children}</main>
      <aside className="col-span-4 flex flex-col gap-4">
        {analytics}
        {team}
      </aside>
    </div>
  );
}
```

---

## 🔍 Intercepting Routes

Intercepting routes allow loading a route from another part of your application within the current layout (e.g. photo modal with shareable URL):

- `(.)` matches segments on the **same level**
- `(..)` matches segments **one level above**
- `(..)(..)` matches segments **two levels above**
- `(...)` matches segments from the **root** `app` directory

```
app/
├── feed/
│   ├── page.tsx
│   └── (..)photo/[id]/     # Intercepts /photo/[id] when navigating from /feed
│       └── page.tsx
└── photo/
    └── [id]/
        └── page.tsx        # Direct page when refreshed or navigated directly
```

---

## 🌐 Route Handlers

Route Handlers allow creating custom request handlers for webhooks or external API consumers:

```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Process webhook event...
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
```
