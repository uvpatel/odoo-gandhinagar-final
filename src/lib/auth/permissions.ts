import { createAccessControl } from "better-auth/plugins/access";

export const statement = {
  dashboard: [
    "view",
    "analytics",
    "reports",
  ],

  employee: [
    "read-self",
    "read",
    "create",
    "update",
    "delete",
  ],

  department: [
    "read",
    "create",
    "update",
    "delete",
  ],

  jobPosition: [
    "read",
    "create",
    "update",
    "delete",
  ],

  contract: [
    "read-self",
    "read",
    "create",
    "update",
    "delete",
  ],

  attendance: [
    "read-self",
    "read",
    "check-in",
    "check-out",
    "create",
    "update",
    "correct",
    "delete",
  ],

  workingSchedule: [
    "read",
    "create",
    "update",
    "delete",
  ],

  timeOffRequest: [
    "read-self",
    "read",
    "create-self",
    "create",
    "update-self",
    "update",
    "cancel-self",
    "approve",
    "refuse",
    "delete",
  ],

  timeOffAllocation: [
    "read-self",
    "read",
    "create",
    "update",
    "delete",
  ],

  timeOffType: [
    "read",
    "create",
    "update",
    "delete",
  ],

  salaryStructure: [
    "read",
    "create",
    "update",
    "delete",
  ],

  salaryRule: [
    "read",
    "create",
    "update",
    "delete",
  ],

  payrun: [
    "read",
    "create",
    "update",
    "delete",
    "compute",
    "validate",
    "mark-paid",
    "send",
  ],

  payslip: [
    "read-self",
    "read",
    "create",
    "update",
    "delete",
    "print-self",
    "print",
    "send",
  ],

  report: [
    "hr",
    "payroll",
    "attendance",
    "time-off",
    "department-cost",
  ],

  organization: [
    "read",
    "update",
  ],

  administration: [
    "manage-users",
    "manage-roles",
  ],
} as const;

export const ac = createAccessControl(statement);

export const employeeRole = ac.newRole({
  dashboard: [
    "view",
  ],

  employee: [
    "read-self",
  ],

  contract: [
    "read-self",
  ],

  attendance: [
    "read-self",
    "check-in",
    "check-out",
  ],

  timeOffRequest: [
    "read-self",
    "create-self",
    "update-self",
    "cancel-self",
  ],

  timeOffAllocation: [
    "read-self",
  ],

  payslip: [
    "read-self",
    "print-self",
  ],
});

export const hrManagerRole = ac.newRole({
  dashboard: [
    "view",
    "analytics",
    "reports",
  ],

  employee: [
    "read-self",
    "read",
    "create",
    "update",
    "delete",
  ],

  department: [
    "read",
    "create",
    "update",
    "delete",
  ],

  jobPosition: [
    "read",
    "create",
    "update",
    "delete",
  ],

  contract: [
    "read-self",
    "read",
    "create",
    "update",
    "delete",
  ],

  attendance: [
    "read-self",
    "read",
    "check-in",
    "check-out",
    "create",
    "update",
    "correct",
    "delete",
  ],

  workingSchedule: [
    "read",
    "create",
    "update",
    "delete",
  ],

  timeOffRequest: [
    "read-self",
    "read",
    "create-self",
    "create",
    "update-self",
    "update",
    "cancel-self",
    "approve",
    "refuse",
    "delete",
  ],

  timeOffAllocation: [
    "read-self",
    "read",
    "create",
    "update",
    "delete",
  ],

  timeOffType: [
    "read",
    "create",
    "update",
    "delete",
  ],

  report: [
    "hr",
    "attendance",
    "time-off",
  ],
});

export const payrollUserRole = ac.newRole({
  dashboard: [
    "view",
    "analytics",
    "reports",
  ],

  employee: [
    "read-self",
    "read",
    "create",
    "update",
    "delete",
  ],

  department: [
    "read",
    "create",
    "update",
    "delete",
  ],

  jobPosition: [
    "read",
    "create",
    "update",
    "delete",
  ],

  contract: [
    "read-self",
    "read",
    "create",
    "update",
    "delete",
  ],

  attendance: [
    "read-self",
    "read",
    "check-in",
    "check-out",
    "create",
    "update",
    "correct",
    "delete",
  ],

  workingSchedule: [
    "read",
    "create",
    "update",
    "delete",
  ],

  timeOffRequest: [
    "read-self",
    "read",
    "create-self",
    "create",
    "update-self",
    "update",
    "cancel-self",
    "approve",
    "refuse",
    "delete",
  ],

  timeOffAllocation: [
    "read-self",
    "read",
    "create",
    "update",
    "delete",
  ],

  timeOffType: [
    "read",
    "create",
    "update",
    "delete",
  ],

  salaryStructure: [
    "read",
    "create",
    "update",
  ],

  salaryRule: [
    "read",
    "create",
    "update",
  ],

  payrun: [
    "read",
    "create",
    "update",
    "compute",
    "validate",
    "mark-paid",
    "send",
  ],

  payslip: [
    "read-self",
    "read",
    "create",
    "update",
    "print-self",
    "print",
    "send",
  ],

  report: [
    "hr",
    "payroll",
    "attendance",
    "time-off",
    "department-cost",
  ],
});

export const payrollManagerRole = ac.newRole({
  dashboard: [
    "view",
    "analytics",
    "reports",
  ],

  employee: [
    "read-self",
    "read",
    "create",
    "update",
    "delete",
  ],

  department: [
    "read",
    "create",
    "update",
    "delete",
  ],

  jobPosition: [
    "read",
    "create",
    "update",
    "delete",
  ],

  contract: [
    "read-self",
    "read",
    "create",
    "update",
    "delete",
  ],

  attendance: [
    "read-self",
    "read",
    "check-in",
    "check-out",
    "create",
    "update",
    "correct",
    "delete",
  ],

  workingSchedule: [
    "read",
    "create",
    "update",
    "delete",
  ],

  timeOffRequest: [
    "read-self",
    "read",
    "create-self",
    "create",
    "update-self",
    "update",
    "cancel-self",
    "approve",
    "refuse",
    "delete",
  ],

  timeOffAllocation: [
    "read-self",
    "read",
    "create",
    "update",
    "delete",
  ],

  timeOffType: [
    "read",
    "create",
    "update",
    "delete",
  ],

  salaryStructure: [
    "read",
    "create",
    "update",
    "delete",
  ],

  salaryRule: [
    "read",
    "create",
    "update",
    "delete",
  ],

  payrun: [
    "read",
    "create",
    "update",
    "delete",
    "compute",
    "validate",
    "mark-paid",
    "send",
  ],

  payslip: [
    "read-self",
    "read",
    "create",
    "update",
    "delete",
    "print-self",
    "print",
    "send",
  ],

  report: [
    "hr",
    "payroll",
    "attendance",
    "time-off",
    "department-cost",
  ],
});

export const adminRole = ac.newRole({
  dashboard: [
    "view",
    "analytics",
    "reports",
  ],

  employee: [
    "read-self",
    "read",
    "create",
    "update",
    "delete",
  ],

  department: [
    "read",
    "create",
    "update",
    "delete",
  ],

  jobPosition: [
    "read",
    "create",
    "update",
    "delete",
  ],

  contract: [
    "read-self",
    "read",
    "create",
    "update",
    "delete",
  ],

  attendance: [
    "read-self",
    "read",
    "check-in",
    "check-out",
    "create",
    "update",
    "correct",
    "delete",
  ],

  workingSchedule: [
    "read",
    "create",
    "update",
    "delete",
  ],

  timeOffRequest: [
    "read-self",
    "read",
    "create-self",
    "create",
    "update-self",
    "update",
    "cancel-self",
    "approve",
    "refuse",
    "delete",
  ],

  timeOffAllocation: [
    "read-self",
    "read",
    "create",
    "update",
    "delete",
  ],

  timeOffType: [
    "read",
    "create",
    "update",
    "delete",
  ],

  salaryStructure: [
    "read",
    "create",
    "update",
    "delete",
  ],

  salaryRule: [
    "read",
    "create",
    "update",
    "delete",
  ],

  payrun: [
    "read",
    "create",
    "update",
    "delete",
    "compute",
    "validate",
    "mark-paid",
    "send",
  ],

  payslip: [
    "read-self",
    "read",
    "create",
    "update",
    "delete",
    "print-self",
    "print",
    "send",
  ],

  report: [
    "hr",
    "payroll",
    "attendance",
    "time-off",
    "department-cost",
  ],

  organization: [
    "read",
    "update",
  ],

  administration: [
    "manage-users",
    "manage-roles",
  ],
});

export const roles = {
  employee: employeeRole,
  hr_manager: hrManagerRole,
  payroll_user: payrollUserRole,
  payroll_manager: payrollManagerRole,
  // Backwards compatibility aliases
  hr_payroll_user: payrollUserRole,
  hr_payroll_manager: payrollManagerRole,
  admin: adminRole,
} as const;

export type AppRole =
  | "employee"
  | "hr_manager"
  | "payroll_user"
  | "payroll_manager"
  | "admin";

export type ResourceName = keyof typeof statement;
export type ActionName<R extends ResourceName> = (typeof statement)[R][number];

export function normalizeRole(role?: string | null): AppRole {
  if (!role) return "employee";
  if (role === "hr_payroll_user") return "payroll_user";
  if (role === "hr_payroll_manager") return "payroll_manager";
  if (role === "admin" || role === "hr_manager" || role === "payroll_user" || role === "payroll_manager") {
    return role as AppRole;
  }
  return "employee";
}

export function hasPermission<R extends ResourceName>(
  role: string | undefined | null,
  resource: R,
  action: ActionName<R>
): boolean {
  const normRole = normalizeRole(role);
  const roleObj = roles[normRole];
  if (!roleObj) return false;
  const allowedActions = (roleObj.statements as Record<string, readonly string[]>)[resource];
  return (allowedActions as readonly string[] | undefined)?.includes(action) ?? false;
}
