import { createAccessControl } from "better-auth/plugins/access"

export const statement = {
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

  contract: [
    "read-self",
    "read",
    "create",
    "update",
    "delete",
  ],

  schedule: [
    "read",
    "create",
    "update",
    "delete",
  ],

  attendance: [
    "read-self",
    "read",
    "create-self",
    "create",
    "update",
    "delete",
  ],

  timeOff: [
    "read-self",
    "read",
    "request",
    "create",
    "update",
    "delete",
    "approve",
    "refuse",
  ],

  allocation: [
    "read-self",
    "read",
    "create",
    "update",
    "delete",
    "approve",
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
    "print",
    "send",
  ],

  report: [
    "read",
  ],

  administration: [
    "manage-users",
    "manage-roles",
  ],
} as const

export const ac = createAccessControl(statement)

export const employeeRole = ac.newRole({
  employee: ["read-self"],

  contract: ["read-self"],

  attendance: [
    "read-self",
    "create-self",
  ],

  timeOff: [
    "read-self",
    "request",
  ],

  allocation: ["read-self"],

  payslip: [
    "read-self",
    "print",
  ],
})

export const hrManagerRole = ac.newRole({
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

  contract: [
    "read-self",
    "read",
    "create",
    "update",
    "delete",
  ],

  schedule: [
    "read",
    "create",
    "update",
    "delete",
  ],

  attendance: [
    "read-self",
    "read",
    "create-self",
    "create",
    "update",
    "delete",
  ],

  timeOff: [
    "read-self",
    "read",
    "request",
    "create",
    "update",
    "delete",
    "approve",
    "refuse",
  ],

  allocation: [
    "read-self",
    "read",
    "create",
    "update",
    "delete",
    "approve",
  ],

  report: ["read"],
})

export const payrollUserRole = ac.newRole({
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

  contract: [
    "read-self",
    "read",
    "create",
    "update",
    "delete",
  ],

  schedule: [
    "read",
    "create",
    "update",
    "delete",
  ],

  attendance: [
    "read-self",
    "read",
    "create-self",
    "create",
    "update",
    "delete",
  ],

  timeOff: [
    "read-self",
    "read",
    "request",
    "create",
    "update",
    "delete",
    "approve",
    "refuse",
  ],

  allocation: [
    "read-self",
    "read",
    "create",
    "update",
    "delete",
    "approve",
  ],

  // READ ONLY
  salaryStructure: ["read"],
  salaryRule: ["read"],

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
    "print",
    "send",
  ],

  report: ["read"],
})

export const payrollManagerRole = ac.newRole({
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

  contract: [
    "read-self",
    "read",
    "create",
    "update",
    "delete",
  ],

  schedule: [
    "read",
    "create",
    "update",
    "delete",
  ],

  attendance: [
    "read-self",
    "read",
    "create-self",
    "create",
    "update",
    "delete",
  ],

  timeOff: [
    "read-self",
    "read",
    "request",
    "create",
    "update",
    "delete",
    "approve",
    "refuse",
  ],

  allocation: [
    "read-self",
    "read",
    "create",
    "update",
    "delete",
    "approve",
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
    "print",
    "send",
  ],

  report: ["read"],
})

export const adminRole = ac.newRole({
  employee: ["read-self", "read", "create", "update", "delete"],

  department: ["read", "create", "update", "delete"],

  contract: ["read-self", "read", "create", "update", "delete"],

  schedule: ["read", "create", "update", "delete"],

  attendance: [
    "read-self",
    "read",
    "create-self",
    "create",
    "update",
    "delete",
  ],

  timeOff: [
    "read-self",
    "read",
    "request",
    "create",
    "update",
    "delete",
    "approve",
    "refuse",
  ],

  allocation: [
    "read-self",
    "read",
    "create",
    "update",
    "delete",
    "approve",
  ],

  salaryStructure: ["read", "create", "update", "delete"],
  salaryRule: ["read", "create", "update", "delete"],

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
    "print",
    "send",
  ],

  report: ["read"],

  administration: [
    "manage-users",
    "manage-roles",
  ],
})


export const roles = {
  employee: employeeRole,
  hr_manager: hrManagerRole,
  payroll_user: payrollUserRole,
  payroll_manager: payrollManagerRole,
  admin: adminRole,
}