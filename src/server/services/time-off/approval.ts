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
        let candidateFound = false;

        // 1. If request already has an assigned allocationId, try that first
        if (allocationId) {
          const [specified] = await tx
            .select()
            .from(timeOffAllocations)
            .where(
              and(
                eq(timeOffAllocations.id, allocationId),
                eq(timeOffAllocations.employeeId, request.employeeId),
                eq(timeOffAllocations.timeOffTypeId, request.timeOffTypeId),
                eq(timeOffAllocations.status, "approved"),
                sql`${timeOffAllocations.validFrom} <= ${request.startDate}`,
                sql`(${timeOffAllocations.validTo} is null or ${timeOffAllocations.validTo} >= ${request.endDate})`
              )
            )
            .for("update");

          if (specified) {
            const [used] = await tx
              .select({ amount: sql<string>`coalesce(sum(${timeOffRequests.duration}), 0)` })
              .from(timeOffRequests)
              .where(
                and(
                  eq(timeOffRequests.allocationId, specified.id),
                  eq(timeOffRequests.status, "approved"),
                  sql`${timeOffRequests.id} != ${request.id}`
                )
              );

            try {
              remainingAllocation(
                Number(specified.allocatedAmount),
                Number(used.amount),
                Number(request.duration)
              );
              candidateFound = true;
            } catch {
              // Allocation doesn't have enough balance, proceed to search others
            }
          }
        }

        // 2. If not satisfied by pre-selected allocation, search eligible approved allocations
        if (!candidateFound) {
          const allocations = await tx
            .select()
            .from(timeOffAllocations)
            .where(
              and(
                eq(timeOffAllocations.employeeId, request.employeeId),
                eq(timeOffAllocations.timeOffTypeId, request.timeOffTypeId),
                eq(timeOffAllocations.status, "approved"),
                sql`${timeOffAllocations.validFrom} <= ${request.startDate}`,
                sql`(${timeOffAllocations.validTo} is null or ${timeOffAllocations.validTo} >= ${request.endDate})`
              )
            )
            .orderBy(asc(timeOffAllocations.validTo), asc(timeOffAllocations.id))
            .for("update");

          allocationId = null;
          for (const allocation of allocations) {
            const [used] = await tx
              .select({ amount: sql<string>`coalesce(sum(${timeOffRequests.duration}), 0)` })
              .from(timeOffRequests)
              .where(
                and(
                  eq(timeOffRequests.allocationId, allocation.id),
                  eq(timeOffRequests.status, "approved"),
                  sql`${timeOffRequests.id} != ${request.id}`
                )
              );

            try {
              remainingAllocation(
                Number(allocation.allocatedAmount),
                Number(used.amount),
                Number(request.duration)
              );
              allocationId = allocation.id;
              candidateFound = true;
              break;
            } catch {
              /* Try the next valid allocation. */
            }
          }
        }

        if (!candidateFound || !allocationId) {
          throw new AuthorizationError(
            "No valid approved allocation has sufficient remaining balance for this entire request",
            409
          );
        }
      }
    }

    const [updated] = await tx
      .update(timeOffRequests)
      .set({
        status,
        allocationId,
        approvedBy: status === "approved" ? actor : request.approvedBy,
        approvedAt: status === "approved" ? new Date() : request.approvedAt,
        refusalReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(timeOffRequests.id, id))
      .returning();

    return updated;
  });
}

/**
 * State machine transition for Time-Off Allocations (draft -> pending -> approved / refused / expired).
 * Enforces transactional consistency and advisory locking.
 */
export async function transitionAllocation(
  id: string,
  status: "draft" | "pending" | "approved" | "refused" | "expired",
  actor: string
) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(360002)`);
    const [allocation] = await tx
      .select()
      .from(timeOffAllocations)
      .where(eq(timeOffAllocations.id, id))
      .for("update");

    if (!allocation) {
      throw new AuthorizationError("Allocation not found", 404);
    }

    if (allocation.status === status) return allocation;

    // Guard: Cannot refuse or demote an approved allocation if approved leave has already consumed it
    if (allocation.status === "approved" && status !== "approved") {
      const [consumed] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(timeOffRequests)
        .where(
          and(
            eq(timeOffRequests.allocationId, allocation.id),
            eq(timeOffRequests.status, "approved")
          )
        );

      if (Number(consumed.count) > 0) {
        throw new AuthorizationError(
          "Cannot alter an approved allocation that already has approved leave requests linked to it",
          409
        );
      }
    }

    const [updated] = await tx
      .update(timeOffAllocations)
      .set({
        status,
        approvedBy: status === "approved" ? actor : allocation.approvedBy,
        approvedAt: status === "approved" ? new Date() : allocation.approvedAt,
      })
      .where(eq(timeOffAllocations.id, id))
      .returning();

    return updated;
  });
}
