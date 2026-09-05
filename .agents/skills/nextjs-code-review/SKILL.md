---
name: nextjs-code-review
description: Systematic code review guidelines and quality audits for Next.js applications, evaluating security, performance, server/client boundaries, state management, and maintainability.
---

# Next.js Code Review & Quality Audit Skill

Use this skill when reviewing pull requests, inspecting codebases, or auditing Next.js applications for security vulnerabilities, architectural flaws, performance bottlenecks, and adherence to modern React/Next.js standards.

---

## 🔍 Systematic Review Checklist

### 1. 🛡️ Security & Authentication
- [ ] **No Secret Leaks**: Verify that private API keys, database connection strings, and webhook secrets are NOT exposed with `NEXT_PUBLIC_` prefixes or imported in Client Components (`'use client'`).
- [ ] **Server Action Authorization**: Verify that all `"use server"` action entrypoints validate authentication (`auth.api.getSession()`) and verify user permissions before performing mutations.
- [ ] **Input Validation**: All incoming requests and action inputs must be strictly validated using a schema validator like Zod.
- [ ] **SQL / Injection Vulnerabilities**: Queries should use parameterized inputs via ORM (Drizzle/Mongoose) and never raw unsanitized string interpolations.

### 2. ⚡ Performance & Core Web Vitals
- [ ] **RSC Boundaries**: Ensure components that fetch data or access backend resources remain Server Components. Prevent unnecessary `'use client'` at high levels in the component tree.
- [ ] **Waterfall Elimination**: Verify that independent data fetches run in parallel (`Promise.all` or independent Suspense boundaries) rather than sequential `await`s.
- [ ] **Asset Optimization**: Ensure all images use `next/image` with dimensions / `sizes` specified, and fonts are loaded via `next/font`.
- [ ] **Bundle Size**: Verify heavy libraries (markdown parsers, charts, animation engines) are imported dynamically via `next/dynamic` or used strictly inside Server Components.

### 3. 🧩 React & State Management
- [ ] **Clean Hooks Usage**: Check for missing dependencies in `useEffect`/`useCallback`/`useMemo` or unnecessary state synchronization anti-patterns.
- [ ] **Proper Key Props**: Verify lists use unique, stable identifiers (e.g. database `id`) instead of array indexes for `key`.
- [ ] **Hydration Safety**: Ensure no browser-only variables (`window`, `localStorage`, non-deterministic dates) cause mismatches during initial server rendering.

### 4. 🗂️ Project Structure & Maintainability
- [ ] **Separation of Concerns**: UI components should not contain raw database queries or HTTP business logic; logic should be delegated to feature actions/services.
- [ ] **Type Safety**: Strictly avoid `any` types. Enforce strict TypeScript compiler options.
- [ ] **Error Handling**: Route segments should provide adequate `error.tsx` and `loading.tsx` fallbacks.

---

## 📋 Structured Review Output Format

When providing code review feedback, structure findings as follows:

```markdown
### 🚨 Critical Issues (Must Fix)
- **[File & Line]**: Issue description, security/correctness impact, and exact suggested code fix.

### ⚠️ Improvements & Optimizations
- **[File & Line]**: Performance, bundle size, or architectural suggestion.

### 💡 Minor / Style Notes
- **[File & Line]**: Code readability, naming conventions, or documentation enhancements.
```
