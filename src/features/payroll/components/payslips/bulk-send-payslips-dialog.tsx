"use client";

import React, { useState } from "react";
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
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
import { type PayslipSummaryItem } from "../../types";

interface BulkSendPayslipsDialogProps {
  selectedPayslips: PayslipSummaryItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BulkSendPayslipsDialog({
  selectedPayslips,
  open,
  onOpenChange,
  onSuccess,
}: BulkSendPayslipsDialogProps) {
  const [useTestRecipient, setUseTestRecipient] = useState(false);
  const [testRecipientEmail, setTestRecipientEmail] = useState("delivered@resend.dev");
  const [attachPdf, setAttachPdf] = useState(true);
  const [customNote, setCustomNote] = useState("");

  const withEmailCount = selectedPayslips.filter((s) => Boolean(s.workEmail)).length;
  const withoutEmailCount = selectedPayslips.length - withEmailCount;
  const totalNet = selectedPayslips.reduce((acc, s) => acc + (s.netAmount || 0), 0);

  const bulkMutation = useMutation({
    mutationFn: async () => {
      const payslipIds = selectedPayslips.map((s) => s.id);
      const res = await fetch("/api/payroll/payslips/bulk-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payslipIds,
          overrideRecipient: useTestRecipient ? testRecipientEmail.trim() : undefined,
          attachPdf,
          customNote: customNote.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Bulk delivery failed");
      }
      return json;
    },
    onSuccess: (res) => {
      const summary = res.data?.summary || "Bulk dispatch completed";
      toast.success(`Resend Dispatch: ${summary}`);
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error(err.message || "Bulk send failed");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UsersIcon className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Bulk Email Salary Slips
              </DialogTitle>
              <DialogDescription className="text-xs">
                Dispatch individual itemized payslips to selected employees using Resend API.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Selected Summary Card */}
        <div className="rounded-lg border bg-muted/30 p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-medium">Selected Payslips:</span>
            <Badge variant="secondary" className="font-mono">
              {selectedPayslips.length} slips
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-medium">Employees with Email:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {withEmailCount} of {selectedPayslips.length}
            </span>
          </div>
          {withoutEmailCount > 0 && (
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
              <span className="font-medium">Missing Email Addresses:</span>
              <span className="font-semibold">{withoutEmailCount} employees</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-1 border-t">
            <span className="text-muted-foreground font-medium">Total Net Disbursement:</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              ₹{totalNet.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="space-y-4 py-1">
          {/* Override / Test Recipient Mode */}
          <div className="space-y-2 rounded-md border p-3 bg-muted/10">
            <div className="flex items-start gap-2.5">
              <Checkbox
                id="useTestRecipient"
                checked={useTestRecipient}
                onCheckedChange={(v) => setUseTestRecipient(Boolean(v))}
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <label
                  htmlFor="useTestRecipient"
                  className="text-xs font-semibold cursor-pointer"
                >
                  Redirect all emails to a single test address
                </label>
                <p className="text-[11px] text-muted-foreground">
                  Convenient for demos & testing: sends all {selectedPayslips.length} payslips to one inbox instead of live employee emails.
                </p>
              </div>
            </div>

            {useTestRecipient && (
              <div className="pt-2 pl-6 space-y-1.5">
                <Label htmlFor="testRecipientEmail" className="text-xs font-medium">
                  Destination Test Email
                </Label>
                <Input
                  id="testRecipientEmail"
                  type="email"
                  value={testRecipientEmail}
                  onChange={(e) => setTestRecipientEmail(e.target.value)}
                  placeholder="e.g. delivered@resend.dev"
                  className="h-8 text-xs"
                />
                <div className="flex gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setTestRecipientEmail("delivered@resend.dev")}
                    className="rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 text-[10px] font-medium hover:bg-blue-100 transition-colors"
                  >
                    delivered@resend.dev
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestRecipientEmail("darshanajudiya07@gmail.com")}
                    className="rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-2 py-0.5 text-[10px] font-medium hover:bg-purple-100 transition-colors"
                  >
                    darshanajudiya07@gmail.com
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Attach PDF Checkbox */}
          <div className="flex items-start gap-2.5 rounded-md border p-2.5 bg-muted/20">
            <Checkbox
              id="bulkAttachPdf"
              checked={attachPdf}
              onCheckedChange={(v) => setAttachPdf(Boolean(v))}
              className="mt-0.5"
            />
            <div className="space-y-0.5">
              <label
                htmlFor="bulkAttachPdf"
                className="text-xs font-medium cursor-pointer flex items-center gap-1.5"
              >
                <FileTextIcon className="size-3.5 text-primary" />
                <span>Attach Itemized PDF Payslips</span>
              </label>
              <p className="text-[11px] text-muted-foreground">
                Each employee receives their individually generated official salary slip PDF.
              </p>
            </div>
          </div>

          {/* Optional Message Note */}
          <div className="space-y-1.5">
            <Label htmlFor="bulkCustomNote" className="text-xs font-semibold">
              Optional Note Included in Email Body
            </Label>
            <textarea
              id="bulkCustomNote"
              rows={2}
              placeholder="e.g. Monthly salary payment has been processed. Please review your attached payslip."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* Resend Notice */}
          <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 p-2.5 flex items-start gap-2 text-xs text-blue-800 dark:text-blue-300">
            <InfoIcon className="size-4 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Resend Dispatch Queue:</strong> Payslips will be transmitted sequentially with individual attachments. Any failed addresses will be reported in the results summary.
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={bulkMutation.isPending}
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => bulkMutation.mutate()}
            disabled={bulkMutation.isPending || selectedPayslips.length === 0}
            className="gap-1.5"
          >
            {bulkMutation.isPending ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : (
              <SendIcon className="size-3.5" />
            )}
            <span>
              {bulkMutation.isPending
                ? "Dispatching via Resend..."
                : `Send ${selectedPayslips.length} Payslips`}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
