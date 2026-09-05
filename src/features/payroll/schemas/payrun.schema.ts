import { z } from "zod";

export const payrunScopeSchema = z
  .object({
    salaryStructureId: z.string().uuid("Please select a valid salary structure"),
    periodStart: z.iso.date(),
    periodEnd: z.iso.date(),
    name: z.string().optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.periodStart);
      const end = new Date(data.periodEnd);
      return start <= end;
    },
    {
      message: "Period start date must be on or before period end date",
      path: ["periodEnd"],
    }
  );

export type PayrunScopeInput = z.infer<typeof payrunScopeSchema>;

export const createPayrunSchema = z
  .object({
    name: z.string().min(3, "Payrun name must be at least 3 characters"),
    salaryStructureId: z.string().uuid("Please select a valid salary structure"),
    periodStart: z.iso.date(),
    periodEnd: z.iso.date(),
    employeeIds: z
      .array(z.string().uuid())
      .min(1, "You must select at least one employee for the payrun"),
  })
  .refine(
    (data) => {
      const start = new Date(data.periodStart);
      const end = new Date(data.periodEnd);
      return start <= end;
    },
    {
      message: "Period start date must be on or before period end date",
      path: ["periodEnd"],
    }
  );

export type CreatePayrunInput = z.infer<typeof createPayrunSchema>;
