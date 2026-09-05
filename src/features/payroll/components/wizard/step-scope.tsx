"use client";

import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePayrunWizardStore } from "../../store/wizard-store";
import { payrunScopeSchema } from "../../schemas/payrun.schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRightIcon, CalendarIcon, LayersIcon, SparklesIcon } from "lucide-react";
import { toast } from "sonner";

interface SalaryStructure {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
}

export function StepScope() {
  const {
    salaryStructureId,
    salaryStructureName,
    periodStart,
    periodEnd,
    runName,
    setScope,
    setStep,
  } = usePayrunWizardStore();

  const [formStart, setFormStart] = useState(periodStart);
  const [formEnd, setFormEnd] = useState(periodEnd);
  const [formStructureId, setFormStructureId] = useState(salaryStructureId);
  const [formRunName, setFormRunName] = useState(runName);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto initialize default dates to current month if empty
  useEffect(() => {
    if (!formStart || !formEnd) {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .slice(0, 10);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .slice(0, 10);

      setFormStart(firstDay);
      setFormEnd(lastDay);
    }
  }, [formStart, formEnd]);

  // Fetch salary structures from DB
  const { data: structuresData, isLoading: isLoadingStructures } = useQuery<{
    data: SalaryStructure[];
  }>({
    queryKey: ["salary-structures"],
    queryFn: async () => {
      const res = await fetch("/api/payroll/structures");
      if (!res.ok) throw new Error("Failed to load salary structures");
      return res.json();
    },
  });

  const structures = structuresData?.data || [];

  // Auto-select standard structure if none selected
  useEffect(() => {
    if (!formStructureId && structures.length > 0) {
      const defaultStruct = structures.find((s) => s.isActive) || structures[0];
      setFormStructureId(defaultStruct.id);
    }
  }, [structures, formStructureId]);

  // Auto update generated name when dates change
  useEffect(() => {
    if (formStart && !runName) {
      const d = new Date(formStart);
      const monthName = d.toLocaleString("default", { month: "long", year: "numeric" });
      setFormRunName(`Monthly Payrun — ${monthName}`);
    }
  }, [formStart, runName]);

  const handleContinue = () => {
    setErrors({});
    const validation = payrunScopeSchema.safeParse({
      salaryStructureId: formStructureId,
      periodStart: formStart,
      periodEnd: formEnd,
      name: formRunName,
    });

    if (!validation.success) {
      const formattedErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        if (issue.path[0]) {
          formattedErrors[issue.path[0] as string] = issue.message;
        }
      }
      setErrors(formattedErrors);
      toast.error(validation.error.issues[0]?.message || "Please check the form inputs");
      return;
    }

    const selectedStruct = structures.find((s) => s.id === formStructureId);

    setScope({
      salaryStructureId: formStructureId,
      salaryStructureName: selectedStruct?.name || "Standard",
      periodStart: formStart,
      periodEnd: formEnd,
      runName: formRunName.trim() || undefined,
    });

    setStep(2);
  };

  return (
    <Card className="max-w-2xl mx-auto shadow-md border-border/80">
      <CardHeader>
        <div className="flex items-center gap-2 text-primary font-medium text-sm">
          <CalendarIcon className="size-4" />
          <span>Step 1 of 2</span>
        </div>
        <CardTitle className="text-xl font-semibold">Define Payroll Scope & Period</CardTitle>
        <CardDescription>
          Specify the payroll cycle duration and the primary salary structure. You can review and filter eligible employees in the next step before saving.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Salary Structure */}
        <div className="space-y-2">
          <Label htmlFor="salaryStructure" className="flex items-center gap-1.5">
            <LayersIcon className="size-3.5 text-muted-foreground" />
            <span>Salary Structure</span>
            <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formStructureId}
            onValueChange={(val) => setFormStructureId(val ?? "")}
            disabled={isLoadingStructures}
          >
            <SelectTrigger id="salaryStructure" className="w-full">
              <SelectValue placeholder={isLoadingStructures ? "Loading structures..." : "Select salary structure"} />
            </SelectTrigger>
            <SelectContent>
              {structures.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} ({s.code}) {!s.isActive && "— [Inactive]"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.salaryStructureId && (
            <p className="text-xs text-destructive">{errors.salaryStructureId}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Contracts configured with this structure will calculate standard allowances and deductions.
          </p>
        </div>

        {/* Period Dates */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="periodStart">
              Period Start <span className="text-destructive">*</span>
            </Label>
            <Input
              id="periodStart"
              type="date"
              value={formStart}
              onChange={(e) => setFormStart(e.target.value)}
            />
            {errors.periodStart && (
              <p className="text-xs text-destructive">{errors.periodStart}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="periodEnd">
              Period End <span className="text-destructive">*</span>
            </Label>
            <Input
              id="periodEnd"
              type="date"
              value={formEnd}
              onChange={(e) => setFormEnd(e.target.value)}
            />
            {errors.periodEnd && (
              <p className="text-xs text-destructive">{errors.periodEnd}</p>
            )}
          </div>
        </div>

        {/* Run Name */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="runName">Payrun Identifier / Name</Label>
            <button
              type="button"
              onClick={() => {
                if (formStart) {
                  const d = new Date(formStart);
                  const monthName = d.toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  });
                  setFormRunName(`Monthly Payrun — ${monthName}`);
                }
              }}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <SparklesIcon className="size-3" />
              Auto-generate
            </button>
          </div>
          <Input
            id="runName"
            placeholder="e.g. Monthly Payrun — March 2026"
            value={formRunName}
            onChange={(e) => setFormRunName(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            A recognizable label shown on administrative reports and payslips.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-4 flex justify-end">
          <Button onClick={handleContinue} className="gap-2">
            <span>Continue to Select Employees</span>
            <ArrowRightIcon className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
