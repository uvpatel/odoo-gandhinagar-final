---
name: nextjs-debugging
description: Diagnostic workflows and root cause analysis for Next.js applications, covering SSR/hydration errors, build failures, server actions, route handlers, middleware, and caching issues.
---

# Next.js Debugging & Diagnostics Skill

Use this skill when diagnosing runtime exceptions, SSR hydration failures, unexpected caching behavior, server action issues, build errors, or performance regressions in Next.js applications.

---

## 🛠️ Step-by-Step Diagnostic Framework

1. **Classify the Fault Layer**:
   - Is it occurring at **Build Time** (static generation, TypeScript typing, bundling)?
   - Is it occurring at **Server Runtime** (Route Handlers, Server Actions, Server Components, DB connections)?
   - Is it occurring at **Client Runtime** (hydration mismatch, event handlers, client state, browser API access)?
2. **Inspect Server Logs & Terminal Output**:
   - Check Node.js stack traces and console errors.
   - Look for unhandled promise rejections and database connection timeout errors.
3. **Inspect Browser Console & DevTools**:
   - Look for React hydration warning diffs showing expected server HTML vs actual client DOM.
   - Check Network tab for 401 Unauthorized, 500 Internal Server, or CORS preflight failures.
4. **Isolate Component Boundaries**:
   - Temporarily comment out suspected child components or replace data-fetching with mock data to isolate the root cause.

---

## 🛑 Common Error Patterns & Solutions

### 1. Hydration Mismatch (`Text content did not match`)
- **Cause**: Browser extensions modifying DOM, invalid HTML structure (e.g. `<div>` inside `<p>`), or date formatting differences between server UTC and client local timezone.
- **Solution**:
  - Fix invalid semantic nesting.
  - Defer rendering time-dependent UI until mounted (`useEffect` + `hasMounted` flag).
  - Add `suppressHydrationWarning` to date/time nodes if purely cosmetic.

### 2. `Dynamic server usage: Page couldn't be rendered statically`
- **Cause**: Route accessed `cookies()`, `headers()`, or `searchParams` without wrapping the component in `<Suspense>` or declaring `export const dynamic = 'force-dynamic'`.
- **Solution**:
  - Add `<Suspense fallback={<Skeleton />}>` around the dynamic segment, or
  - Explicitly set `export const dynamic = 'force-dynamic'` on the route segment if it is strictly dynamic.

### 3. Server Action `Error: Only plain objects, and a few built-ins, can be passed to Client Components`
- **Cause**: Returning complex class instances (e.g., Mongoose document, custom Class, functions, Decimal objects) across the server/client boundary.
- **Solution**:
  - Sanitize the return value to JSON primitives: `return JSON.parse(JSON.stringify(result))` or convert IDs to strings (`doc._id.toString()`).

### 4. Route Handler CORS or Preflight Failure
- **Cause**: External clients fetching `/api/*` routes without appropriate CORS headers.
- **Solution**:
  - Add OPTIONS handler in the route:
    ```typescript
    export async function OPTIONS() {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }
    ```
