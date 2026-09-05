import { defineRelations } from "drizzle-orm";
import * as schema from "../schema";

export const relations = defineRelations(schema, (r) => ({
  users: {
    accounts: r.many.accounts(),
    sessions: r.many.sessions(),
    employee: r.one.employees({
      from: r.users.id,
      to: r.employees.userId,
    }),
  },
  accounts: {
    user: r.one.users({
      from: r.accounts.userId,
      to: r.users.id,
    }),
  },
  sessions: {
    user: r.one.users({
      from: r.sessions.userId,
      to: r.users.id,
    }),
  },
  departments: {
    employees: r.many.employees(),
    contracts: r.many.contracts(),
  },
  jobPositions: {
    employees: r.many.employees(),
    contracts: r.many.contracts(),
  },
  workingSchedules: {
    lines: r.many.workingScheduleLines(),
    employees: r.many.employees(),
    contracts: r.many.contracts(),
  },
  workingScheduleLines: {
    schedule: r.one.workingSchedules({
      from: r.workingScheduleLines.scheduleId,
      to: r.workingSchedules.id,
    }),
  },
  employees: {
    user: r.one.users({
      from: r.employees.userId,
      to: r.users.id,
    }),
    department: r.one.departments({
      from: r.employees.departmentId,
      to: r.departments.id,
    }),
    jobPosition: r.one.jobPositions({
      from: r.employees.jobPositionId,
      to: r.jobPositions.id,
    }),
    workingSchedule: r.one.workingSchedules({
      from: r.employees.workingScheduleId,
      to: r.workingSchedules.id,
    }),
    manager: r.one.employees({
      alias: "manager",
      from: r.employees.managerId,
      to: r.employees.id,
    }),
    contracts: r.many.contracts(),
    attendance: r.many.attendance(),
    allocations: r.many.timeOffAllocations(),
    timeOffRequests: r.many.timeOffRequests(),
    payslips: r.many.payslips(),
    history: r.many.employeeHistory(),
  },
  employeeHistory: {
    employee: r.one.employees({
      from: r.employeeHistory.employeeId,
      to: r.employees.id,
    }),
    previousDepartment: r.one.departments({
      alias: "previousDepartment",
      from: r.employeeHistory.previousDepartmentId,
      to: r.departments.id,
    }),
    newDepartment: r.one.departments({
      alias: "newDepartment",
      from: r.employeeHistory.newDepartmentId,
      to: r.departments.id,
    }),
    previousJobPosition: r.one.jobPositions({
      alias: "previousJobPosition",
      from: r.employeeHistory.previousJobPositionId,
      to: r.jobPositions.id,
    }),
    newJobPosition: r.one.jobPositions({
      alias: "newJobPosition",
      from: r.employeeHistory.newJobPositionId,
      to: r.jobPositions.id,
    }),
  },
  contracts: {
    employee: r.one.employees({
      from: r.contracts.employeeId,
      to: r.employees.id,
    }),
    department: r.one.departments({
      from: r.contracts.departmentId,
      to: r.departments.id,
    }),
    jobPosition: r.one.jobPositions({
      from: r.contracts.jobPositionId,
      to: r.jobPositions.id,
    }),
    workingSchedule: r.one.workingSchedules({
      from: r.contracts.workingScheduleId,
      to: r.workingSchedules.id,
    }),
    salaryStructure: r.one.salaryStructures({
      from: r.contracts.salaryStructureId,
      to: r.salaryStructures.id,
    }),
    payslips: r.many.payslips(),
  },
  attendance: {
    employee: r.one.employees({
      from: r.attendance.employeeId,
      to: r.employees.id,
    }),
    corrections: r.many.attendanceCorrections(),
  },
  attendanceCorrections: {
    attendance: r.one.attendance({
      from: r.attendanceCorrections.attendanceId,
      to: r.attendance.id,
    }),
    requester: r.one.users({
      alias: "requester",
      from: r.attendanceCorrections.requestedBy,
      to: r.users.id,
    }),
    approver: r.one.users({
      alias: "approver",
      from: r.attendanceCorrections.approvedBy,
      to: r.users.id,
    }),
  },
  timeOffTypes: {
    allocations: r.many.timeOffAllocations(),
    requests: r.many.timeOffRequests(),
  },
  timeOffAllocations: {
    employee: r.one.employees({
      from: r.timeOffAllocations.employeeId,
      to: r.employees.id,
    }),
    timeOffType: r.one.timeOffTypes({
      from: r.timeOffAllocations.timeOffTypeId,
      to: r.timeOffTypes.id,
    }),
    approver: r.one.users({
      from: r.timeOffAllocations.approvedBy,
      to: r.users.id,
    }),
    requests: r.many.timeOffRequests(),
  },
  timeOffRequests: {
    employee: r.one.employees({
      from: r.timeOffRequests.employeeId,
      to: r.employees.id,
    }),
    timeOffType: r.one.timeOffTypes({
      from: r.timeOffRequests.timeOffTypeId,
      to: r.timeOffTypes.id,
    }),
    allocation: r.one.timeOffAllocations({
      from: r.timeOffRequests.allocationId,
      to: r.timeOffAllocations.id,
    }),
    approver: r.one.users({
      from: r.timeOffRequests.approvedBy,
      to: r.users.id,
    }),
  },
  salaryStructures: {
    rules: r.many.salaryStructureRules(),
    contracts: r.many.contracts(),
    payruns: r.many.payruns(),
    payslips: r.many.payslips(),
  },
  salaryRules: {
    structures: r.many.salaryStructureRules(),
    payslipLines: r.many.payslipLines(),
  },
  salaryStructureRules: {
    structure: r.one.salaryStructures({
      from: r.salaryStructureRules.salaryStructureId,
      to: r.salaryStructures.id,
    }),
    rule: r.one.salaryRules({
      from: r.salaryStructureRules.salaryRuleId,
      to: r.salaryRules.id,
    }),
  },
  payruns: {
    salaryStructure: r.one.salaryStructures({
      from: r.payruns.salaryStructureId,
      to: r.salaryStructures.id,
    }),
    creator: r.one.users({
      from: r.payruns.createdBy,
      to: r.users.id,
    }),
    payslips: r.many.payslips(),
  },
  payslips: {
    payrun: r.one.payruns({
      from: r.payslips.payrunId,
      to: r.payruns.id,
    }),
    employee: r.one.employees({
      from: r.payslips.employeeId,
      to: r.employees.id,
    }),
    contract: r.one.contracts({
      from: r.payslips.contractId,
      to: r.contracts.id,
    }),
    salaryStructure: r.one.salaryStructures({
      from: r.payslips.salaryStructureId,
      to: r.salaryStructures.id,
    }),
    lines: r.many.payslipLines(),
    warnings: r.many.payslipWarnings(),
  },
  payslipLines: {
    payslip: r.one.payslips({
      from: r.payslipLines.payslipId,
      to: r.payslips.id,
    }),
    salaryRule: r.one.salaryRules({
      from: r.payslipLines.salaryRuleId,
      to: r.salaryRules.id,
    }),
  },
  payslipWarnings: {
    payslip: r.one.payslips({
      from: r.payslipWarnings.payslipId,
      to: r.payslips.id,
    }),
  },
}));
