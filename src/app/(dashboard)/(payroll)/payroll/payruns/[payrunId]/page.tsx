import React from "react";
import { PayrunDetailView } from "@/features/payroll/components/payruns/payrun-detail-view";

interface PayrunPageProps {
  params: Promise<{ payrunId: string }>;
}

export const metadata = {
  title: "Payrun Processing | PeoplePay360",
  description: "Compute, validate, and disburse monthly payroll",
};

export default async function PayrunDetailPage({ params }: PayrunPageProps) {
  const { payrunId } = await params;

  return (
    <div className="p-6">
      <PayrunDetailView payrunId={payrunId} />
    </div>
  );
}
