---
name: fullstack-architect
description: End-to-end fullstack system design, technical specifications, database modeling, API architecture, infrastructure, and scalability planning for modern web apps.
---

# Fullstack System Architect Skill

This skill guides the high-level system design, architectural technical specs, data model design, security posture, and infrastructure decisions for modern, scalable web applications.

---

## 🏛️ System Design & Architecture Framework

When designing a fullstack application from scratch or re-architecting an existing system:

```
┌─────────────────────────────────────────────────────────────┐
│                    CDN & Edge (Vercel / Cloudflare)         │
│  - Edge Caching & Routing                                   │
│  - DDoS Protection & SSL Termination                        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Next.js Application Layer (App Router)          │
│  - React Server Components (RSC) for Zero-JS Rendering      │
│  - Server Actions & Route Handlers for API Mutations        │
│  - Client Components with React Hook Form & Radix / shadcn  │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐┌─────────────────────────────┐
│ Authentication & Authz       ││ AI & Orchestration Layer    │
│ - Better Auth / Sessions     ││ - Vercel AI SDK             │
│ - RBAC / ABAC Permissions    ││ - Google Gemini (Flash/Pro) │
└──────────────┬───────────────┘└─────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data & Storage Layer                      │
│  - Neon Serverless PostgreSQL / Supabase with Drizzle ORM   │
│  - Redis / Upstash for Caching & Rate Limiting              │
│  - S3 / R2 / UploadThing for Object Storage                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 📑 Technical Specification Template

When creating an architecture design document, follow this structure:

### 1. Executive Summary & Problem Statement
- Core problem solved and target audience.
- Non-functional requirements (throughput, latency, availability, compliance).

### 2. High-Level Architecture & Tech Stack Selection
- **Frontend / Framework**: Next.js (App Router, Server Components).
- **Styling & UI**: Tailwind CSS + shadcn/ui.
- **Database & ORM**: PostgreSQL (Neon) with Drizzle ORM.
- **Authentication**: Better Auth with OAuth + Session Cookies.
- **AI Integration**: Vercel AI SDK + Google Gemini.
- **Deployment & Hosting**: Vercel / Cloudflare.

### 3. Data Model & Entity Relationship (ERD)
- Define tables, primary keys, foreign keys, constraints, and indexes.

### 4. API & Mutation Contract
- Define Server Action signatures, Route Handler endpoints, and input/output Zod schemas.

### 5. Security & Compliance
- Session management, cookie flags, CORS policies, rate limiting, and RBAC matrix.

### 6. Scalability, Caching & Performance
- Edge caching, database connection pooling strategies, dynamic imports, and streaming fallbacks.
