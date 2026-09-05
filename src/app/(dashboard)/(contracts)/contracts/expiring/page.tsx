import * as React from "react";
import { ContractManagementView } from "@/features/contracts/components/contract-management-view";

export const dynamic = "force-dynamic";

export default function ExpiringContractsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-8 text-center text-xs text-muted-foreground">
          Loading expiring contracts...
        </div>
      }
    >
      <ContractManagementView initialStatusFilter="expiring" initialViewMode="table" />
    </React.Suspense>
  );
}
