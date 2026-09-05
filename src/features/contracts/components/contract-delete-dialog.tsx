"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangleIcon } from "lucide-react";
import { toast } from "sonner";
import { type ContractItem } from "../types";

interface ContractDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: ContractItem | null;
  onSuccess: () => void;
}

export function ContractDeleteDialog({
  open,
  onOpenChange,
  contract,
  onSuccess,
}: ContractDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  if (!contract) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/contracts?id=${contract.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete contract");
      }

      toast.success("Contract record deleted", {
        description: `${contract.contractNumber} has been removed.`,
      });
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error("Deletion prevented", {
        description: err.message,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangleIcon className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Delete Contract {contract.contractNumber}?
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Confirm deletion of this employment contract record
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs text-muted-foreground">
          <p>
            You are about to delete contract <span className="font-semibold text-foreground">{contract.contractNumber}</span> belonging to{" "}
            <span className="font-semibold text-foreground">{contract.employeeName || "Unknown"}</span>.
          </p>
          <div className="rounded-md border bg-muted/40 p-3 space-y-1">
            <div className="flex justify-between">
              <span>Start Date:</span>
              <span className="font-medium text-foreground">{contract.startDate}</span>
            </div>
            <div className="flex justify-between">
              <span>End Date:</span>
              <span className="font-medium text-foreground">{contract.endDate || "Indefinite"}</span>
            </div>
            <div className="flex justify-between">
              <span>Monthly Wage:</span>
              <span className="font-medium text-foreground">₹{Number(contract.wage).toLocaleString("en-IN")}</span>
            </div>
          </div>
          <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-md">
            Note: If this contract is already linked to historical payslips or payroll batches, the system will block deletion to preserve payroll audit history.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Confirm Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
