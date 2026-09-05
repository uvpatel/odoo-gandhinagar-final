# Mongoose & MongoDB in Next.js App Router

How to establish persistent, cached connections and define type-safe models using Mongoose with Next.js in a serverless environment.

---

## 📦 1. Installation

```bash
npm install mongoose
```

---

## 🔌 2. Global Connection Caching Pattern

In Next.js serverless functions, module scope is preserved across invocations in the same lambda container, but re-executed across new containers. Caching the connection on the global object avoids spawning new connections on every request.

```typescript
// src/server/db/mongodb.ts
import mongoose from "mongoose";
import { env } from "@/lib/env";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
    };

    cached.promise = mongoose.connect(env.DATABASE_URL, opts).then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
```

---

## 🗄️ 3. Schema & Model Definition

To avoid `Cannot overwrite model once compiled` errors in Next.js development hot-reloading:

```typescript
// src/server/db/models/organization.model.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrganization extends Document {
  name: string;
  slug: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    ownerId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

export const Organization: Model<IOrganization> =
  mongoose.models.Organization ||
  mongoose.model<IOrganization>("Organization", OrganizationSchema);
```

---

## 🚀 4. Usage in Server Actions / Handlers

```typescript
// src/features/organizations/actions/get-org.ts
"use server";

import { connectToDatabase } from "@/server/db/mongodb";
import { Organization } from "@/server/db/models/organization.model";

export async function getOrganizationBySlug(slug: string) {
  await connectToDatabase();
  const org = await Organization.findOne({ slug }).lean();
  if (!org) return null;

  // Convert MongoDB _id to string for serialization
  return {
    ...org,
    _id: org._id.toString(),
  };
}
```
