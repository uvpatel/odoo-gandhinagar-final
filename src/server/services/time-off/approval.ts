import { db } from "@/db";
import { timeOffRequests, timeOffAllocations, timeOffTypes } from "@/db/schema";
import { and, eq, sql, asc } from "drizzle-orm";
import { remainingAllocation } from "@/server/domain/hr";
import { AuthorizationError } from "@/lib/auth/authorization";

/** The approved request and its allocationId are the consumption ledger. Cancellation releases it. */
export async function transitionLeave(id: string, status: "approved" | "refused" | "cancelled", actor: string, reason?: string) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(360002)`);
    const [request] = await tx.select().from(timeOffRequests).where(eq(timeOffRequests.id, id)).for("update");
    if (!request) throw new AuthorizationError("Time-off request not found", 404);
    if (request.status === status) return request;
    if (status === "approved" && request.status !== "pending") throw new AuthorizationError("Only pending requests can be approved", 409);
    if (status === "refused" && request.status !== "pending") throw new AuthorizationError("Only pending requests can be refused; cancel approved leave to reverse consumption", 409);
    if (status === "cancelled" && !["draft", "pending", "approved"].includes(request.status)) throw new AuthorizationError("Request cannot be cancelled", 409);
    let allocationId = request.allocationId;
    if (status === "approved") {
      const [type] = await tx.select().from(timeOffTypes).where(eq(timeOffTypes.id, request.timeOffTypeId));
      if (!type?.isActive) throw new AuthorizationError("Leave type is inactive", 409);
      if (type.approvalMode === "manager_and_hr") throw new AuthorizationError("Two-stage approval is not configured; select a supported approval mode", 409);
      if (type.requiresAllocation) {
        const allocations = await tx.select().from(timeOffAllocations).where(and(
          eq(timeOffAllocations.employeeId, request.employeeId), eq(timeOffAllocations.timeOffTypeId, request.timeOffTypeId),
          eq(timeOffAllocations.status, "approved"), sql`${timeOffAllocations.validFrom} <= ${request.startDate}`,
          sql`(${timeOffAllocations.validTo} is null or ${timeOffAllocations.validTo} >= ${request.endDate})`
        )).orderBy(asc(timeOffAllocations.validTo), asc(timeOffAllocations.id)).for("update");
        allocationId = null;
        for (const allocation of allocations) {
          const [used] = await tx.select({ amount: sql<string>`coalesce(sum(${timeOffRequests.duration}), 0)` }).from(timeOffRequests).where(and(eq(timeOffRequests.allocationId, allocation.id), eq(timeOffRequests.status, "approved")));
          try { remainingAllocation(Number(allocation.allocatedAmount), Number(used.amount), Number(request.duration)); allocationId = allocation.id; break; } catch { /* Try the next valid allocation. */ }
        }
        if (!allocationId) throw new AuthorizationError("No valid approved allocation has sufficient remaining balance for this entire request", 409);
      }
    }
    const [updated] = await tx.update(timeOffRequests).set({ status, allocationId, approvedBy: status === "approved" ? actor : request.approvedBy,
      approvedAt: status === "approved" ? new Date() : request.approvedAt, refusalReason: reason, updatedAt: new Date() }).where(eq(timeOffRequests.id, id)).returning();
    return updated;
  });
}
