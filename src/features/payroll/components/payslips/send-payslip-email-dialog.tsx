"use client";

import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  MailIcon,
  SendIcon,
  FileTextIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  Loader2Icon,
  InfoIcon,
} from "lucide-react";
import { toast } from "sonner";

export interface SendPayslipTarget {
  id: string;
  payslipNumber: string;
  employeeName: string;
  employeeNumber?: string;
  workEmail?: string | null;
  periodStart: string;
  periodEnd: string;
  netAmount: number;
  grossAmount?: number;
}

interface SendPayslipEmailDialogProps {
  payslip: SendPayslipTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SendPayslipEmailDialog({
  payslip,
  open,
  onOpenChange,
  onSuccess,
}: SendPayslipEmailDialogProps) {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [attachPdf, setAttachPdf] = useState(true);
  const [customNote, setCustomNote] = useState("");

  useEffect(() => {
    if (payslip) {
      setRecipientEmail(payslip.workEmail || "");
      setSubject(
        `Official Payslip ${payslip.payslipNumber} for Period ${payslip.periodStart} to ${payslip.periodEnd}`
      );
      setAttachPdf(true);
      setCustomNote("");
    }
  }, [payslip]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!payslip) throw new Error("No payslip selected");
      const res = await fetch(`/api/payroll/payslips/${payslip.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: recipientEmail.trim(),
          subject: subject.trim(),
          attachPdf,
          customNote: customNote.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to dispatch payslip email via Resend");
      }
      return json;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Salary slip email successfully dispatched via Resend!");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error(err.message || "Email dispatch failed. Please verify recipient address.");
    },
  });

  if (!payslip) return null;

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MailIcon className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Send Payslip by Email
              </DialogTitle>
              <DialogDescription className="text-xs">
                Dispatch itemized salary breakdown and official PDF attachment via Resend API.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Payslip Summary Card */}
        <div className="rounded-lg border bg-muted/30 p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-medium">Payslip:</span>
            <span className="font-mono font-bold text-foreground">{payslip.payslipNumber}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-medium">Employee:</span>
            <span className="font-semibold text-foreground">
              {payslip.employeeName}
              {payslip.employeeNumber ? ` (${payslip.employeeNumber})` : ""}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-medium">Pay Period:</span>
            <span>
              {payslip.periodStart} &rarr; {payslip.periodEnd}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t">
            <span className="text-muted-foreground font-medium">Net Take-Home:</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              ₹{payslip.netAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="space-y-4 py-1">
          {/* Recipient Input & Chips */}
          <div className="space-y-1.5">
            <Label htmlFor="recipientEmail" className="text-xs font-semibold">
              Recipient Email Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="recipientEmail"
              type="email"
              placeholder="e.g. employee@company.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="h-9 text-xs"
            />

            {/* Helper Shortcut Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-muted-foreground">Quick fill:</span>
              {payslip.workEmail && (
                <button
                  type="button"
                  onClick={() => setRecipientEmail(payslip.workEmail!)}
                  className="rounded bg-secondary/80 px-2 py-0.5 text-[11px] font-medium text-secondary-foreground hover:bg-secondary transition-colors"
                >
                  Employee ({payslip.workEmail})
                </button>
              )}
              <button
                type="button"
                onClick={() => setRecipientEmail("delivered@resend.dev")}
                className="rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 text-[11px] font-medium hover:bg-blue-100 transition-colors"
                title="Resend official mock recipient for test verification"
              >
                delivered@resend.dev (Test)
              </button>
              <button
                type="button"
                onClick={() => setRecipientEmail("darshanajudiya07@gmail.com")}
                className="rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-2 py-0.5 text-[11px] font-medium hover:bg-purple-100 transition-colors"
                title="Resend Account Owner"
              >
                darshanajudiya07@gmail.com
              </button>
            </div>

            {!payslip.workEmail && !recipientEmail && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
                <AlertCircleIcon className="size-3 shrink-0" />
                <span>Employee has no email set in profile. Please type an email address.</span>
              </p>
            )}
          </div>

          {/* Subject Line */}
          <div className="space-y-1.5">
            <Label htmlFor="subject" className="text-xs font-semibold">
              Email Subject
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          {/* PDF Attachment Checkbox */}
          <div className="flex items-start gap-2.5 rounded-md border p-2.5 bg-muted/20">
            <Checkbox
              id="attachPdf"
              checked={attachPdf}
              onCheckedChange={(v) => setAttachPdf(Boolean(v))}
              className="mt-0.5"
            />
            <div className="space-y-0.5">
              <label
                htmlFor="attachPdf"
                className="text-xs font-medium cursor-pointer flex items-center gap-1.5"
              >
                <FileTextIcon className="size-3.5 text-primary" />
                <span>Attach Official PDF Payslip</span>
              </label>
              <p className="text-[11px] text-muted-foreground">
                Dynamically renders an encrypted A4 formal payslip with all allowances and statutory deductions.
              </p>
            </div>
          </div>

          {/* Optional Message Note */}
          <div className="space-y-1.5">
            <Label htmlFor="customNote" className="text-xs font-semibold">
              Optional Note / Instructions
            </Label>
            <textarea
              id="customNote"
              rows={2}
              placeholder="e.g. Please find attached your approved salary slip for this cycle."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* Resend Notice */}
          <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 p-2.5 flex items-start gap-2 text-xs text-blue-800 dark:text-blue-300">
            <InfoIcon className="size-4 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Powered by Resend API:</strong> In sandbox/development mode, emails to verified domains, the registered account owner, or <code>delivered@resend.dev</code> are delivered directly.
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={sendMutation.isPending}
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => sendMutation.mutate()}
            disabled={sendMutation.isPending || !isValidEmail(recipientEmail)}
            className="gap-1.5"
          >
            {sendMutation.isPending ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : (
              <SendIcon className="size-3.5" />
            )}
            <span>{sendMutation.isPending ? "Sending via Resend..." : "Send Salary Slip"}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
