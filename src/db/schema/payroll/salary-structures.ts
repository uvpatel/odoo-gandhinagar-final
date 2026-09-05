import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const salaryStructures = pgTable(
  "salary_structures",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", {
      length: 120,
    }).notNull(),
    code: varchar("code", {
      length: 30,
    })
      .notNull()
      .unique(),
    description: text("description"),
    isActive: boolean("is_active")
      .default(true)
      .notNull(),
    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  },
);

export type SalaryStructure = typeof salaryStructures.$inferSelect;
export type NewSalaryStructure = typeof salaryStructures.$inferInsert;
