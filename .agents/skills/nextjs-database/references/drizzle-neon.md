# Drizzle ORM & Neon Serverless PostgreSQL

Drizzle ORM combined with Neon Serverless PostgreSQL provides low latency, type safety, and automatic connection management tailored for edge and serverless runtimes.

---

## 📦 1. Installation

```bash
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
```

---

## 🔌 2. Client Connection

```typescript
// src/server/db/index.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { env } from "@/lib/env";

const sql = neon(env.DATABASE_URL);
export const db = drizzle(sql, { schema });
```

---

## 🗄️ 3. Schema Definitions

```typescript
// src/server/db/schema.ts
import { pgTable, text, timestamp, varchar, boolean, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").default(false),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const posts = pgTable(
  "posts",
  {
    id: text("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content"),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    authorIdx: index("posts_author_idx").on(table.authorId),
  })
);

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));
```

---

## ⚡ 4. Relational Queries & Transactions

```typescript
// Query with relations
export async function getUserWithPosts(userId: string) {
  return await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, userId),
    with: {
      posts: {
        limit: 10,
        orderBy: (posts, { desc }) => [desc(posts.createdAt)],
      },
    },
  });
}

// Transaction
export async function createPostWithNotification(authorId: string, title: string) {
  return await db.transaction(async (tx) => {
    const [newPost] = await tx
      .insert(posts)
      .values({
        id: crypto.randomUUID(),
        title,
        authorId,
      })
      .returning();

    // Secondary operation in same transaction...
    return newPost;
  });
}
```
