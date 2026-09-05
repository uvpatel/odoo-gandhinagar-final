import React from "react";
import { PayrunWizard } from "@/features/payroll/components/wizard/payrun-wizard";

export const metadata = {
  title: "New Payrun Wizard | PeoplePay360",
  description: "Create and scope a new monthly payrun with eligible employee selection",
};

export default function NewPayrunPage() {
  return (
    <div className="p-6">
      <PayrunWizard />
    </div>
  );
}
