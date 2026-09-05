import { create } from "zustand";
import { type EligibleEmployee } from "../types";

interface PayrunWizardState {
  currentStep: 1 | 2;
  // Step 1 data
  salaryStructureId: string;
  salaryStructureName: string;
  periodStart: string;
  periodEnd: string;
  runName: string;
  // Step 2 data
  selectedEmployeeIds: string[];
  searchTerm: string;
  departmentFilter: string;
  eligibilityFilter: "all" | "eligible" | "warning" | "ineligible";

  // Actions
  setStep: (step: 1 | 2) => void;
  setScope: (data: {
    salaryStructureId: string;
    salaryStructureName: string;
    periodStart: string;
    periodEnd: string;
    runName?: string;
  }) => void;
  toggleEmployee: (employeeId: string) => void;
  selectAllEligible: (employees: EligibleEmployee[]) => void;
  deselectAll: () => void;
  setSearchTerm: (term: string) => void;
  setDepartmentFilter: (dept: string) => void;
  setEligibilityFilter: (filter: "all" | "eligible" | "warning" | "ineligible") => void;
  resetWizard: () => void;
}

export const usePayrunWizardStore = create<PayrunWizardState>((set) => ({
  currentStep: 1,
  salaryStructureId: "",
  salaryStructureName: "",
  periodStart: "",
  periodEnd: "",
  runName: "",
  selectedEmployeeIds: [],
  searchTerm: "",
  departmentFilter: "all",
  eligibilityFilter: "all",

  setStep: (step) => set({ currentStep: step }),

  setScope: (data) =>
    set({
      salaryStructureId: data.salaryStructureId,
      salaryStructureName: data.salaryStructureName,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      runName:
        data.runName ||
        `Payrun — ${new Date(data.periodStart).toLocaleString("default", {
          month: "long",
          year: "numeric",
        })}`,
    }),

  toggleEmployee: (employeeId) =>
    set((state) => {
      const exists = state.selectedEmployeeIds.includes(employeeId);
      return {
        selectedEmployeeIds: exists
          ? state.selectedEmployeeIds.filter((id) => id !== employeeId)
          : [...state.selectedEmployeeIds, employeeId],
      };
    }),

  selectAllEligible: (employees) =>
    set({
      selectedEmployeeIds: employees
        .filter((emp) => emp.eligibility === "eligible" || emp.eligibility === "warning")
        .map((emp) => emp.id),
    }),

  deselectAll: () => set({ selectedEmployeeIds: [] }),

  setSearchTerm: (term) => set({ searchTerm: term }),

  setDepartmentFilter: (dept) => set({ departmentFilter: dept }),

  setEligibilityFilter: (filter) => set({ eligibilityFilter: filter }),

  resetWizard: () =>
    set({
      currentStep: 1,
      salaryStructureId: "",
      salaryStructureName: "",
      periodStart: "",
      periodEnd: "",
      runName: "",
      selectedEmployeeIds: [],
      searchTerm: "",
      departmentFilter: "all",
      eligibilityFilter: "all",
    }),
}));
