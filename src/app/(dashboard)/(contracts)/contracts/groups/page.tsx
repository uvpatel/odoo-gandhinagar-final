import * as React from "react";
import { ContractManagementView } from "@/features/contracts/components/contract-management-view";

export const dynamic = "force-dynamic";

export default function ContractGroupsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-8 text-center text-xs text-muted-foreground">
          Loading contract groups...
        </div>
      }
    >
      <ContractManagementView initialStatusFilter="all" initialViewMode="groups" />
    </React.Suspense>
  );
}
