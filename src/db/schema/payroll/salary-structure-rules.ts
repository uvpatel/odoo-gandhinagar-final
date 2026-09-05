import {
  pgTable,
  uuid,
  boolean,
  integer,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { salaryStructures } from "./salary-structures";
import { salaryRules } from "./salary-rules";

export const salaryStructureRules = pgTable(
  "salary_structure_rules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salaryStructureId: uuid("salary_structure_id")
      .notNull()
      .references(() => salaryStructures.id, {
        onDelete: "cascade",
      }),
    salaryRuleId: uuid("salary_rule_id")
      .notNull()
      .references(() => salaryRules.id, {
        onDelete: "cascade",
      }),
    sequence: integer("sequence")
      .notNull(),
    isActive: boolean("is_active")
      .default(true)
      .notNull(),
  },
  (table) => [
    unique().on(
      table.salaryStructureId,
      table.salaryRuleId,
    ),
    index("structure_rules_structure_idx").on(table.salaryStructureId),
  ],
);

export type SalaryStructureRule = typeof salaryStructureRules.$inferSelect;
export type NewSalaryStructureRule = typeof salaryStructureRules.$inferInsert;
