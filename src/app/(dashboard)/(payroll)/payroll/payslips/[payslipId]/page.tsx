import React from "react";
import { PayslipDetailView } from "@/features/payroll/components/payslips/payslip-detail-view";

interface PayslipPageProps {
  params: Promise<{ payslipId: string }>;
}

export const metadata = {
  title: "Payslip Breakdown | PeoplePay360",
  description: "Itemized salary calculation rules and PDF generation",
};

export default async function PayslipDetailPage({ params }: PayslipPageProps) {
  const { payslipId } = await params;

  return (
    <div className="p-6">
      <PayslipDetailView payslipId={payslipId} />
    </div>
  );
}
