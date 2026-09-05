import React from "react";
import { PayrunListView } from "@/features/payroll/components/payruns/payrun-list-view";

export const metadata = {
  title: "Payruns | PeoplePay360",
  description: "Manage monthly payroll cycles and disburse payslips",
};

export default function PayrunsPage() {
  return (
    <div className="p-6">
      <PayrunListView />
    </div>
  );
}
