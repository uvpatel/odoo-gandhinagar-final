import React from "react";
import { PayrollDashboardView } from "@/features/payroll/components/dashboard/payroll-dashboard-view";

export const metadata = {
  title: "Payroll Operations Dashboard | PeoplePay360",
  description: "Real-time payroll analytics, compensation KPIs, and workflow operations",
};

export default function PayrollPage() {
  return (
    <div className="p-6">
      <PayrollDashboardView />
    </div>
  );
}
