export type ContractStatus = "draft" | "active" | "expired" | "terminated" | "cancelled";

export interface ContractItem {
  id: string;
  contractNumber: string;
  employeeId: string;
  employeeName: string | null;
  employeeNumber: string | null;
  startDate: string;
  endDate: string | null;
  departmentId: string | null;
  departmentName: string | null;
  jobPositionId: string | null;
  jobTitle: string | null;
  workingScheduleId: string | null;
  workingScheduleName: string | null;
  salaryStructureId: string | null;
  salaryStructureName: string | null;
  wage: string;
  currency: string;
  status: ContractStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeOption {
  id: string;
  fullName: string;
  employeeNumber: string;
  departmentId: string | null;
  jobPositionId: string | null;
  workEmail?: string | null;
}

export interface DepartmentOption {
  id: string;
  name: string;
  code: string;
}

export interface JobPositionOption {
  id: string;
  title: string;
  code: string;
}

export interface WorkingScheduleOption {
  id: string;
  name: string;
}

export interface SalaryStructureOption {
  id: string;
  name: string;
}

export type ContractTimelineTag = "active" | "upcoming" | "expired" | "terminated" | "draft" | "cancelled";

export function getContractTimelineTag(
  contract: Pick<ContractItem, "status" | "startDate" | "endDate">,
  today: string = new Date().toISOString().split("T")[0]
): ContractTimelineTag {
  if (contract.status === "cancelled") return "cancelled";
  if (contract.status === "draft") return "draft";
  if (contract.status === "terminated") return "terminated";

  // Active status lifecycle
  if (contract.startDate > today) {
    return "upcoming";
  }
  if (contract.endDate && contract.endDate < today) {
    return "expired";
  }
  return "active";
}
