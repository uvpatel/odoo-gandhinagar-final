"use client";

import React, { useEffect, useState, useMemo } from "react";
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
import { ArrowRightIcon, CalendarIcon, LayersIcon, SparklesIcon, AlertTriangleIcon } from "lucide-react";
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

  // Fetch existing payruns to suggest next available payroll period
  const { data: payrunsData } = useQuery<{
    data: Array<{ id: string; name: string; periodStart: string; periodEnd: string; status: string }>;
  }>({
    queryKey: ["payruns"],
    queryFn: async () => {
      const res = await fetch("/api/payroll/payruns");
      if (!res.ok) return { data: [] };
      return res.json();
    },
  });

  const payruns = useMemo(() => {
    if (Array.isArray(payrunsData)) return payrunsData;
    if (Array.isArray((payrunsData as any)?.data)) return (payrunsData as any).data;
    return [];
  }, [payrunsData]);

  const nextSuggestedCycle = useMemo(() => {
    const activePayruns = payruns.filter((p: any) => p.status !== "cancelled");
    if (activePayruns.length === 0) {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .slice(0, 10);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .slice(0, 10);
      return { start: firstDay, end: lastDay };
    }

    const sortedEnds = activePayruns
      .map((p: any) => p.periodEnd)
      .sort((a: string, b: string) => (a > b ? -1 : 1));
    const latestEnd = sortedEnds[0];

    const [year, month] = latestEnd.split("-").map(Number);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;

    const startStr = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
    const lastDayOfMonth = new Date(nextYear, nextMonth, 0).getDate();
    const endStr = `${nextYear}-${String(nextMonth).padStart(2, "0")}-${String(lastDayOfMonth).padStart(2, "0")}`;

    return { start: startStr, end: endStr };
  }, [payruns]);

  // Auto initialize default dates to next available cycle if empty
  useEffect(() => {
    if (!formStart || !formEnd) {
      setFormStart(nextSuggestedCycle.start);
      setFormEnd(nextSuggestedCycle.end);

      const d = new Date(nextSuggestedCycle.start + "T00:00:00");
      const monthName = d.toLocaleString("default", { month: "long", year: "numeric" });
      if (!runName) {
        setFormRunName(`Monthly Payrun — ${monthName}`);
      }
    }
  }, [formStart, formEnd, nextSuggestedCycle, runName]);

  const conflictingPayrun = useMemo(() => {
    if (!formStart || !formEnd) return null;
    return payruns.find(
      (p: any) =>
        p.status !== "cancelled" &&
        p.periodStart <= formEnd &&
        p.periodEnd >= formStart
    );
  }, [payruns, formStart, formEnd]);

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

  const structures: SalaryStructure[] = Array.isArray(structuresData)
    ? structuresData
    : Array.isArray((structuresData as any)?.data)
    ? (structuresData as any).data
    : [];

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
      const d = new Date(formStart + "T00:00:00");
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

        {/* Overlapping Payrun Conflict Banner */}
        {conflictingPayrun && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangleIcon className="size-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="font-semibold">
                Payrun already exists for this period: {conflictingPayrun.name} ({conflictingPayrun.periodStart} to {conflictingPayrun.periodEnd})
              </p>
              <p className="text-muted-foreground">
                Employees who already have payslips in that cycle cannot be duplicated. Select an open period to process new payroll.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1.5 mt-1 border-amber-500/40 hover:bg-amber-500/20"
                onClick={() => {
                  setFormStart(nextSuggestedCycle.start);
                  setFormEnd(nextSuggestedCycle.end);
                  const d = new Date(nextSuggestedCycle.start + "T00:00:00");
                  const monthName = d.toLocaleString("default", { month: "long", year: "numeric" });
                  setFormRunName(`Monthly Payrun — ${monthName}`);
                }}
              >
                <SparklesIcon className="size-3 text-amber-600" />
                <span>Switch to Next Recommended Cycle ({nextSuggestedCycle.start} &rarr; {nextSuggestedCycle.end})</span>
              </Button>
            </div>
          </div>
        )}

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
