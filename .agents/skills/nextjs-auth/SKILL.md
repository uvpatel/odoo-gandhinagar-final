---
name: nextjs-auth
description: Authentication and authorization patterns for Next.js, covering Better Auth, OAuth providers (GitHub/Google), session management, middleware, and RBAC.
---

# Next.js Authentication & Authorization Skill

This skill provides comprehensive instructions for architecting secure, reliable, and modern authentication and authorization workflows in Next.js using Better Auth, OAuth providers (e.g. GitHub), and Role-Based Access Control (RBAC).

---

## 🔐 Core Architecture

Modern Next.js authentication requires:
1. **Server-Side Session Verification**: Validating sessions in Server Components and Route Handlers with secure HTTP-only cookies.
2. **Edge-Compatible Middleware Guarding**: Pre-authenticating requests before reaching route handlers or page renders.
3. **Robust Auth Framework**: Using [Better Auth](https://better-auth.com/) as the primary modern auth solution for Next.js and TypeScript.
4. **Fine-Grained Permissions**: RBAC and ABAC (Attribute-Based Access Control) enforced at both the API/action level and the UI layer.

---

## 📂 Topic References

- [Better Auth Integration](./references/better-auth.md): Complete setup, database schema, server/client configuration, and session management.
- [GitHub OAuth Setup](./references/github-oauth.md): GitHub App / OAuth configuration, environment secrets, user profile mapping, and error handling.
- [Role-Based Access Control (RBAC)](./references/rbac.md): Role hierarchies, permission matrices, middleware protection, and server action guard patterns.

---

## 🛡️ Security Best Practices

1. **HTTP-Only, Secure Cookies**: Ensure auth cookies use `HttpOnly`, `SameSite=Lax`, and `Secure` attributes in production.
2. **CSRF Protection**: Better Auth handles CSRF token validation out of the box for mutation endpoints.
3. **Never Expose User Secrets**: User password hashes, 2FA recovery keys, and OAuth access tokens must never be sent to the client browser.
4. **Always Authorize on Server**: Never rely solely on client-side role checks or hidden UI buttons. Every Server Action and Route Handler MUST verify user identity and role.
