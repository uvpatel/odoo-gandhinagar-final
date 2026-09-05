"use client";

import React from "react";
import Link from "next/link";
import { usePayrunWizardStore } from "../../store/wizard-store";
import { StepScope } from "./step-scope";
import { StepEmployees } from "./step-employees";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import { CheckIcon, ChevronRightIcon, ArrowLeftIcon } from "lucide-react";

export function PayrunWizard() {
  const { currentStep } = usePayrunWizardStore();

  return (
    <div className="flex flex-col gap-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href="/payroll" className="hover:text-foreground">
              Payroll
            </Link>
            <ChevronRightIcon className="size-3" />
            <Link href="/payroll/payruns" className="hover:text-foreground">
              Payruns
            </Link>
            <ChevronRightIcon className="size-3" />
            <span className="text-foreground font-medium">New Payrun</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create Monthly Payrun</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Follow the 2-step wizard to scope the payroll cycle and verify eligible employee records.
          </p>
        </div>

        <Link
          href="/payroll/payruns"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5 self-start sm:self-auto")}
        >
          <ArrowLeftIcon className="size-3.5" />
          <span>Exit Wizard</span>
        </Link>
      </div>

      {/* Stepper Progress Indicator */}
      <div className="max-w-xl mx-auto w-full px-4">
        <div className="flex items-center justify-between relative">
          {/* Connecting Line */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-border -z-0" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary transition-all duration-300 -z-0"
            style={{ width: currentStep === 1 ? "0%" : "100%" }}
          />

          {/* Step 1 Node */}
          <div className="flex flex-col items-center gap-1.5 bg-background px-3 z-10">
            <div
              className={cn(
                "size-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                currentStep > 1
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary text-primary-foreground ring-4 ring-primary/20"
              )}
            >
              {currentStep > 1 ? <CheckIcon className="size-4" /> : "1"}
            </div>
            <span className="text-xs font-medium text-foreground">1. Scope & Period</span>
          </div>

          {/* Step 2 Node */}
          <div className="flex flex-col items-center gap-1.5 bg-background px-3 z-10">
            <div
              className={cn(
                "size-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                currentStep === 2
                  ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                  : "bg-muted text-muted-foreground border border-border"
              )}
            >
              2
            </div>
            <span
              className={cn(
                "text-xs font-medium",
                currentStep === 2 ? "text-foreground" : "text-muted-foreground"
              )}
            >
              2. Select Employees
            </span>
          </div>
        </div>
      </div>

      {/* Active Step Content */}
      <div className="w-full">
        {currentStep === 1 ? <StepScope /> : <StepEmployees />}
      </div>
    </div>
  );
}
