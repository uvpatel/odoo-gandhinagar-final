import * as React from "react";
import { ContractManagementView } from "@/features/contracts/components/contract-management-view";

export const dynamic = "force-dynamic";

export default function ActiveContractsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-8 text-center text-xs text-muted-foreground">
          Loading active contracts...
        </div>
      }
    >
      <ContractManagementView initialStatusFilter="active" initialViewMode="table" />
    </React.Suspense>
  );
}
