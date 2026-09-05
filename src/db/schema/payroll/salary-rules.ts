import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  numeric,
  pgEnum,
} from "drizzle-orm/pg-core";

export const salaryRuleCategoryEnum = pgEnum(
  "salary_rule_category",
  [
    "basic",
    "allowance",
    "gross",
    "deduction",
    "contribution",
    "net",
  ],
);

export const computationTypeEnum = pgEnum(
  "salary_computation_type",
  [
    "fixed",
    "percentage",
    "formula",
  ],
);

export const salaryRules = pgTable("salary_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", {
    length: 120,
  }).notNull(),
  code: varchar("code", {
    length: 30,
  })
    .notNull()
    .unique(),
  category: salaryRuleCategoryEnum("category")
    .notNull(),
  computationType:
    computationTypeEnum("computation_type")
      .notNull(),
  fixedAmount: numeric("fixed_amount", {
    precision: 14,
    scale: 2,
  }),
  percentage: numeric("percentage", {
    precision: 8,
    scale: 4,
  }),
  percentageBase: varchar("percentage_base", {
    length: 100,
  }),
  formula: text("formula"),
  sequence: integer("sequence")
    .default(10)
    .notNull(),
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

export type SalaryRule = typeof salaryRules.$inferSelect;
export type NewSalaryRule = typeof salaryRules.$inferInsert;
