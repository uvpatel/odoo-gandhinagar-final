---
name: nextjs-production
description: Production-grade architectural patterns, App Router conventions, React Server Component boundaries, caching, and deployment optimization for Next.js applications.
---

# Next.js Production Engineering Skill

This skill guides the design, implementation, and deployment of scalable, maintainable, and high-performance Next.js applications using the App Router.

---

## 🎯 Core Principles

1. **Server-First by Default**: Default to React Server Components (RSC). Only opt into `'use client'` when state, event listeners, effects, or browser-only APIs are required.
2. **Predictable Data Flow**: Fetch data close to where it is consumed within Server Components or Server Actions. Minimize prop drilling and eliminate unnecessary client-side fetch waterfalls.
3. **Layered Architecture**: Enforce strict separation between presentation (components), business logic (services/actions), data access (ORM/DB queries), and configuration.
4. **Resilience & Security**: Validate all inputs at the boundary (Zod), sanitize user inputs, protect server actions with authentication and authorization checks, and handle errors gracefully using error boundaries (`error.tsx`) and not-found boundaries (`not-found.tsx`).
5. **Measurable Performance**: Optimize Core Web Vitals (LCP, INP, CLS) using Partial Prerendering (PPR), streaming Suspense boundaries, modern image/font loading, and effective caching strategies.

---

## 📂 Topic References

For deep dives into specific topics, consult the reference documents in this skill:

- [Architecture & Project Structure](./references/architecture.md): Recommended directory layouts, layer separation, environment variable safety, and modularity.
- [App Router & Advanced Routing](./references/routing.md): Route groups, parallel routes, intercepting routes, route handlers, and middleware patterns.
- [Server vs. Client Components](./references/server-client.md): Boundary rules, composition strategies, serialization constraints, and interop patterns.
- [Performance Optimization](./references/performance.md): Streaming with Suspense, Partial Prerendering (PPR), caching modes, dynamic IO, and bundle size reduction.
- [Production Debugging](./references/debugging.md): Solving hydration errors, build-time static generation failures, memory leaks, and runtime edge cases.

---

## 🏗️ Quick Reference: Component Boundary Rules

| Feature / Need | Server Component (RSC) | Client Component (`'use client'`) |
| :--- | :---: | :---: |
| Fetch data directly from DB / Backend | ✅ Recommended | ❌ Avoid |
| Access secret keys & environment variables | ✅ Direct | ❌ Never (security leak) |
| React hooks (`useState`, `useEffect`, `useReducer`) | ❌ Not available | ✅ Recommended |
| Event handlers (`onClick`, `onChange`, `onSubmit`) | ❌ Not available | ✅ Recommended |
| Browser APIs (`localStorage`, `window`, `navigator`) | ❌ Not available | ✅ Recommended |
| Keep large dependencies on server (zero client bundle) | ✅ Yes | ❌ Adds to client bundle |

---

## 🛡️ Production Checklist

- [ ] All environment variables are validated at build/runtime using schema validation (e.g. `@t3-oss/env-nextjs` or Zod).
- [ ] Server Actions have authorization checks and input validation (`zod`).
- [ ] Data fetching utilizes appropriate caching semantics (`fetch` cache, `revalidateTag`, `revalidatePath`).
- [ ] Image assets use `next/image` with explicit dimensions and `priority` for above-the-fold hero images.
- [ ] Fonts use `next/font` for zero layout shift and local font hosting.
- [ ] Route segments include proper `loading.tsx`, `error.tsx`, and `not-found.tsx` fallbacks.
- [ ] Metadata and OpenGraph tags are configured statically or dynamically via `generateMetadata`.
- [ ] Error logging and performance monitoring (e.g. Sentry, OpenTelemetry) are integrated.
