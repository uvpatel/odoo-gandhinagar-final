import React from "react";
import { PayslipsListView } from "@/features/payroll/components/payslips/payslips-list-view";

export const metadata = {
  title: "Payslips Directory | PeoplePay360",
  description: "Browse, audit, and print all organization salary slips",
};

export default function PayslipsPage() {
  return (
    <div className="p-6">
      <PayslipsListView />
    </div>
  );
}
