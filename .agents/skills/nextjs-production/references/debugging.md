# Next.js Production Debugging Reference

Common production errors in Next.js applications and their systematic resolutions.

---

## 🛑 1. Hydration Mismatch Errors

**Symptom**: `Hydration failed because the initial UI does not match what was rendered on the server.`

### Common Causes & Fixes:
1. **Invalid HTML Nesting**:
   - `<p>` inside another `<p>`
   - `<div>` inside `<p>`
   - `<table>` missing `<tbody>`
   - *Fix*: Inspect HTML hierarchy and ensure valid semantics.
2. **Browser-only APIs during render**:
   - Using `typeof window !== 'undefined'`, `localStorage`, or `navigator` directly during render.
   - *Fix*: Move browser checks into `useEffect` or use an `isMounted` state.
3. **Date / Time Formatting**:
   - Server renders UTC, client formats to user timezone.
   - *Fix*: Use a dedicated client component with `useEffect` or suppress hydration with `suppressHydrationWarning` on specific text nodes if unavoidable.

---

## ⚡ 2. "Dynamic Server Usage" Errors

**Symptom**: `Dynamic server usage: Page couldn't be rendered statically because it used cookies/headers/searchParams.`

### Fix:
- Recognize that routes accessing `headers()`, `cookies()`, or dynamic `searchParams` become dynamic at request time.
- If static export or prerendering is desired, wrap dynamic components in `<Suspense>` or move dynamic data fetching to server actions or client-side queries.

---

## 🔒 3. "Cannot access private/server env on client"

**Symptom**: Environment variable is `undefined` on the browser.

### Fix:
- Client variables must be prefixed with `NEXT_PUBLIC_`.
- Server secrets (e.g. `DATABASE_URL`, API secret keys) must NEVER be prefixed with `NEXT_PUBLIC_` and only imported in server files (`"use server"`, Route Handlers, or RSC).

---

## 🔄 4. Server Action State Out-of-Sync

**Symptom**: UI does not reflect database mutations after a Server Action executes.

### Fix:
- Ensure you call `revalidatePath("/target-path")` or `revalidateTag("cache-tag")` inside the server action immediately after persisting changes.
- Ensure the client form or component handles optimistic updates or resets properly.
