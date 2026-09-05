"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircleIcon,
  InfoIcon,
  DollarSignIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ShieldAlertIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  type ContractItem,
  type EmployeeOption,
  type DepartmentOption,
  type JobPositionOption,
  type WorkingScheduleOption,
  type SalaryStructureOption,
  type ContractStatus,
} from "../types";
import { checkContractOverlapInMemory } from "@/server/services/payroll/contract-resolver";

interface ContractFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingContract: ContractItem | null;
  employeesList: EmployeeOption[];
  departmentsList: DepartmentOption[];
  jobPositionsList: JobPositionOption[];
  schedulesList: WorkingScheduleOption[];
  salaryStructuresList: SalaryStructureOption[];
  allContracts: ContractItem[];
  preselectedEmployeeId?: string | null;
  onSuccess: () => void;
}

export function ContractFormDialog({
  open,
  onOpenChange,
  editingContract,
  employeesList,
  departmentsList,
  jobPositionsList,
  schedulesList,
  salaryStructuresList,
  allContracts,
  preselectedEmployeeId,
  onSuccess,
}: ContractFormDialogProps) {
  const [formData, setFormData] = React.useState({
    contractNumber: "",
    employeeId: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    departmentId: "",
    jobPositionId: "",
    workingScheduleId: "",
    salaryStructureId: "",
    wage: "85000",
    currency: "INR",
    status: "active" as ContractStatus,
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [clientErrors, setClientErrors] = React.useState<Record<string, string>>({});

  // Reset or populate form when dialog opens
  React.useEffect(() => {
    if (!open) return;

    if (editingContract) {
      setFormData({
        contractNumber: editingContract.contractNumber,
        employeeId: editingContract.employeeId,
        startDate: editingContract.startDate,
        endDate: editingContract.endDate || "",
        departmentId: editingContract.departmentId || "",
        jobPositionId: editingContract.jobPositionId || "",
        workingScheduleId: editingContract.workingScheduleId || "",
        salaryStructureId: editingContract.salaryStructureId || "",
        wage: String(editingContract.wage),
        currency: editingContract.currency || "INR",
        status: editingContract.status,
      });
    } else {
      const year = new Date().getFullYear();
      const nextNum = allContracts.length + 1;
      const autoNumber = `CON-${year}-${String(nextNum).padStart(4, "0")}`;

      const initialEmp = preselectedEmployeeId
        ? employeesList.find((e) => e.id === preselectedEmployeeId) || employeesList[0]
        : employeesList[0];

      setFormData({
        contractNumber: autoNumber,
        employeeId: initialEmp?.id || "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        departmentId: initialEmp?.departmentId || departmentsList[0]?.id || "",
        jobPositionId: initialEmp?.jobPositionId || jobPositionsList[0]?.id || "",
        workingScheduleId: schedulesList[0]?.id || "",
        salaryStructureId: salaryStructuresList[0]?.id || "",
        wage: "85000",
        currency: "INR",
        status: "active",
      });
    }
    setClientErrors({});
  }, [open, editingContract, preselectedEmployeeId, employeesList, departmentsList, jobPositionsList, schedulesList, salaryStructuresList, allContracts.length]);

  // Sync department and job position when employee changes
  const handleEmployeeChange = (empId: string) => {
    const emp = employeesList.find((e) => e.id === empId);
    setFormData((prev) => ({
      ...prev,
      employeeId: empId,
      departmentId: emp?.departmentId || prev.departmentId,
      jobPositionId: emp?.jobPositionId || prev.jobPositionId,
    }));
  };

  // Real-time client-side validation & overlap check
  const overlapWarning = React.useMemo(() => {
    if (!formData.employeeId || !formData.startDate || formData.status === "cancelled") {
      return null;
    }

    const check = checkContractOverlapInMemory(
      allContracts,
      {
        id: editingContract?.id,
        employeeId: formData.employeeId,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        status: formData.status,
      }
    );

    return check.hasOverlap ? check.message : null;
  }, [formData.employeeId, formData.startDate, formData.endDate, formData.status, editingContract?.id, allContracts]);

  // Validate form fields
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.employeeId) {
      errors.employeeId = "Please select an employee";
    }

    if (!formData.startDate) {
      errors.startDate = "Contract start date is required";
    }

    if (formData.endDate && formData.endDate < formData.startDate) {
      errors.endDate = "End date cannot be earlier than start date";
    }

    const wageNum = Number(formData.wage);
    if (isNaN(wageNum) || wageNum <= 0) {
      errors.wage = "Monthly wage must be a positive number greater than 0";
    }

    if (!formData.salaryStructureId) {
      errors.salaryStructureId = "Salary structure is required for payroll calculation";
    }

    if (overlapWarning) {
      errors.overlap = overlapWarning;
    }

    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Validation error", {
        description: Object.values(clientErrors)[0] || "Please check all required fields",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingContract) {
        const res = await fetch(`/api/contracts/${editingContract.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update contract");

        toast.success("Contract updated successfully", {
          description: `${formData.contractNumber} terms updated.`,
        });
      } else {
        const res = await fetch("/api/contracts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create contract");

        toast.success("Contract created successfully", {
          description: `${formData.contractNumber} established.`,
        });
      }

      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error("Action failed", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-bold">
                {editingContract
                  ? `Edit Contract / ${editingContract.contractNumber}`
                  : `New Employment Contract / ${formData.contractNumber}`}
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                {editingContract
                  ? "Update contract terms, wage conditions, and dates"
                  : "Establish a new employment contract record for this employee"}
              </DialogDescription>
            </div>
            {editingContract && (
              <Badge variant="outline" className="font-mono text-xs">
                {editingContract.contractNumber}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Overlap Error Banner */}
          {overlapWarning && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5 animate-in fade-in">
              <ShieldAlertIcon className="size-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <span className="font-bold">Overlapping Contract Conflict:</span>
                <p className="mt-0.5">{overlapWarning}</p>
                <p className="mt-1 text-[11px] opacity-85">
                  Adjust the start or end dates, or conclude the existing contract prior to starting a new one.
                </p>
              </div>
            </div>
          )}

          {/* Row 1: Employee & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="employeeId" className="text-xs font-semibold">
                Employee <span className="text-rose-500">*</span>
              </Label>
              <select
                id="employeeId"
                required
                disabled={Boolean(editingContract)}
                value={formData.employeeId}
                onChange={(e) => handleEmployeeChange(e.target.value)}
                className={`h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 ${
                  clientErrors.employeeId ? "border-rose-500 ring-rose-500" : "border-input"
                }`}
              >
                <option value="">Select Employee...</option>
                {employeesList.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.employeeNumber})
                  </option>
                ))}
              </select>
              {clientErrors.employeeId && (
                <p className="text-[11px] text-rose-500">{clientErrors.employeeId}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contractNumber" className="text-xs font-semibold">
                Contract Reference Number
              </Label>
              <Input
                id="contractNumber"
                value={formData.contractNumber}
                onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                placeholder="Auto-generated e.g. CON-2026-0001"
                className="h-9 font-mono text-xs"
              />
            </div>
          </div>

          {/* Row 2: Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="startDate" className="text-xs font-semibold">
                Effective Start Date <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className={`h-9 text-xs ${
                  clientErrors.startDate ? "border-rose-500 ring-rose-500" : ""
                }`}
              />
              {clientErrors.startDate && (
                <p className="text-[11px] text-rose-500">{clientErrors.startDate}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="endDate" className="text-xs font-semibold">
                End Date (Optional)
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className={`h-9 text-xs ${
                  clientErrors.endDate ? "border-rose-500 ring-rose-500" : ""
                }`}
              />
              <span className="text-[11px] text-muted-foreground">
                Leave blank for open-ended / permanent employment.
              </span>
              {clientErrors.endDate && (
                <p className="text-[11px] text-rose-500">{clientErrors.endDate}</p>
              )}
            </div>
          </div>

          {/* Row 3: Wage & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="wage" className="text-xs font-semibold">
                Monthly Wage (₹) <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">
                  ₹
                </span>
                <Input
                  id="wage"
                  type="number"
                  required
                  step="100"
                  min="1"
                  value={formData.wage}
                  onChange={(e) => setFormData({ ...formData, wage: e.target.value })}
                  placeholder="e.g. 85000"
                  className={`h-9 pl-7 font-medium text-sm ${
                    clientErrors.wage ? "border-rose-500 ring-rose-500" : ""
                  }`}
                />
              </div>
              {clientErrors.wage && (
                <p className="text-[11px] text-rose-500">{clientErrors.wage}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-semibold">
                Contract Lifecycle Status
              </Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as ContractStatus })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="active">Active (Running / In Effect)</option>
                <option value="draft">Draft (Pending Approval)</option>
                <option value="expired">Expired (Historical Term Concluded)</option>
                <option value="terminated">Terminated (Early Conclusion)</option>
                <option value="cancelled">Cancelled (Voided)</option>
              </select>
            </div>
          </div>

          {/* Row 4: Department & Job Position */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="departmentId" className="text-xs font-semibold">
                Department
              </Label>
              <select
                id="departmentId"
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Select Department...</option>
                {departmentsList.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="jobPositionId" className="text-xs font-semibold">
                Job Position / Title
              </Label>
              <select
                id="jobPositionId"
                value={formData.jobPositionId}
                onChange={(e) => setFormData({ ...formData, jobPositionId: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Select Job Position...</option>
                {jobPositionsList.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 5: Structure & Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="salaryStructureId" className="text-xs font-semibold">
                Salary Structure <span className="text-rose-500">*</span>
              </Label>
              <select
                id="salaryStructureId"
                required
                value={formData.salaryStructureId}
                onChange={(e) => setFormData({ ...formData, salaryStructureId: e.target.value })}
                className={`h-9 w-full rounded-md border bg-background px-3 text-xs focus:outline-none focus:ring-1 ${
                  clientErrors.salaryStructureId ? "border-rose-500 ring-rose-500" : "border-input"
                }`}
              >
                <option value="">Select Salary Structure...</option>
                {salaryStructuresList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {clientErrors.salaryStructureId && (
                <p className="text-[11px] text-rose-500">{clientErrors.salaryStructureId}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="workingScheduleId" className="text-xs font-semibold">
                Working Schedule
              </Label>
              <select
                id="workingScheduleId"
                value={formData.workingScheduleId}
                onChange={(e) => setFormData({ ...formData, workingScheduleId: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Standard 40 hours / week</option>
                {schedulesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Helper Banner */}
          <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2.5">
            <InfoIcon className="size-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <span className="font-semibold">Historical Integrity Rule:</span> Never overwrite past contracts when promoting or changing wages. Always create a sequential contract starting the day after the previous contract ends.
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || Boolean(overlapWarning)}
              className={Boolean(overlapWarning) ? "opacity-50 cursor-not-allowed" : ""}
            >
              {isSubmitting
                ? "Saving..."
                : editingContract
                ? "Update Contract"
                : "Create Contract"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
