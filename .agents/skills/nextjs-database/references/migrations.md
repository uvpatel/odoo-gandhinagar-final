# Database Migrations with Drizzle Kit

Managing schema lifecycles, generating migration files, running safe deployments, and seeding initial data.

---

## ⚙️ 1. Drizzle Kit Configuration

Create `drizzle.config.ts` in the project root:

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
});
```

---

## 📜 2. Package.json Scripts

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx src/server/db/seed.ts"
  }
}
```

---

## 🛡️ 3. Safe Migration Workflow

1. **Modify Schema**: Update TypeScript schema definitions in `src/server/db/schema.ts`.
2. **Generate Migration SQL**:
   ```bash
   npm run db:generate
   ```
   Inspect the generated SQL inside the `drizzle/` directory to verify there are no unintended column drops or breaking constraints.
3. **Execute Migration**:
   ```bash
   npm run db:migrate
   ```

---

## 🔄 4. Expand and Contract Pattern

For zero-downtime database updates in production:
1. **Expand**: Add new nullable columns or tables. Deploy application code that reads from old or new and writes to both.
2. **Backfill**: Run a migration script to populate data into new columns.
3. **Contract**: Update application to only use new schema. Deploy application code. Finally, drop the old unused columns.
