---
name: nextjs-database
description: Database integration, ORM modeling, connection pooling, and migrations for Next.js using Drizzle ORM with Neon (PostgreSQL) and Mongoose with MongoDB.
---

# Next.js Database Engineering Skill

This skill provides guidelines and patterns for integrating SQL (PostgreSQL via Neon & Drizzle ORM) and NoSQL (MongoDB via Mongoose) databases into Next.js App Router applications, focusing on connection efficiency in serverless environments.

---

## 💾 Core Principles

1. **Serverless Connection Management**: Prevent connection exhaustion by using HTTP/WebSocket pooling adapters (Neon Serverless Driver) or global connection caching (Mongoose).
2. **Type-Safe Schema First**: Define strict schemas in TypeScript to ensure end-to-end type safety from database query results to UI components.
3. **Zero-Downtime Migrations**: Adopt the expand-contract pattern for schema changes to prevent breaking active instances during deployment.
4. **Optimized Queries**: Select only required fields (`select({ id: table.id, name: table.name })`) and leverage indexes for foreign keys and frequent query filters.

---

## 📂 Topic References

- [Drizzle ORM & Neon Postgres](./references/drizzle-neon.md): Serverless connection setup, schema definitions, relational queries, and transactions.
- [Mongoose & MongoDB](./references/mongoose.md): Connection caching pattern for Next.js, schema design, model compilation, and serverless best practices.
- [Database Migrations](./references/migrations.md): Automated migration workflows, Drizzle Kit configuration, zero-downtime migrations, and seeding.

---

## ⚖️ Database Choice Matrix

| Feature | Neon PostgreSQL + Drizzle ORM | MongoDB + Mongoose |
| :--- | :--- | :--- |
| **Best For** | Relational data, ACID transactions, complex joins, SaaS apps | Document models, flexible schemas, rapid prototyping |
| **Serverless Driver** | `@neondatabase/serverless` (HTTP / WebSockets) | Connection caching in global object |
| **Type Safety** | Native TypeScript schema inference | TypeScript schemas with `InferSchemaType` |
| **Migrations** | Drizzle Kit automated SQL migrations | Manual scripts / schema evolution |
