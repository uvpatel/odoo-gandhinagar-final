import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const jobPositions = pgTable("job_positions", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 120 }).notNull(),
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
});

export type JobPosition = typeof jobPositions.$inferSelect;
export type NewJobPosition = typeof jobPositions.$inferInsert;
