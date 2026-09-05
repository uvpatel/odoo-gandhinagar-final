import { describe, it, expect } from "bun:test";

type PayrunStatus = "draft" | "computed" | "validated" | "paid" | "cancelled";

interface MockPayrun {
  id: string;
  status: PayrunStatus;
  computedAt: Date | null;
  validatedAt: Date | null;
  paidAt: Date | null;
}

interface MockWarning {
  id: string;
  payrunId: string;
  severity: "info" | "warning" | "error";
  resolved: boolean;
  message: string;
}

class PayrunStateMachine {
  static transitionToComputed(payrun: MockPayrun, payslipCount: number): MockPayrun {
    if (payrun.status === "validated" || payrun.status === "paid") {
      throw new Error(`Cannot recompute payrun in ${payrun.status} status. It is immutable.`);
    }
    if (payslipCount === 0) {
      throw new Error("Cannot compute payrun with 0 eligible employees.");
    }
    return {
      ...payrun,
      status: "computed",
      computedAt: new Date(),
    };
  }

  static transitionToValidated(payrun: MockPayrun, warnings: MockWarning[]): MockPayrun {
    if (payrun.status !== "computed") {
      throw new Error(`Only computed payruns can be validated. Current status: ${payrun.status}`);
    }

    const unresolvedErrors = warnings.filter(
      (w) => w.payrunId === payrun.id && w.severity === "error" && !w.resolved
    );

    if (unresolvedErrors.length > 0) {
      throw new Error(
        `Cannot validate payrun: ${unresolvedErrors.length} blocking error(s) must be resolved first.`
      );
    }

    return {
      ...payrun,
      status: "validated",
      validatedAt: new Date(),
    };
  }

  static transitionToPaid(payrun: MockPayrun): MockPayrun {
    if (payrun.status !== "validated") {
      throw new Error(`Only validated payruns can be marked as paid. Current status: ${payrun.status}`);
    }

    return {
      ...payrun,
      status: "paid",
      paidAt: new Date(),
    };
  }

  static cancelPayrun(payrun: MockPayrun): MockPayrun {
    if (payrun.status === "paid") {
      throw new Error("Cannot cancel a paid payrun. Reverse disbursements through ledger adjustments.");
    }
    return {
      ...payrun,
      status: "cancelled",
    };
  }
}

describe("Payrun Finite State Machine & Immutability Rules", () => {
  it("executes the happy path lifecycle: draft -> computed -> validated -> paid", () => {
    let pr: MockPayrun = {
      id: "pr-001",
      status: "draft",
      computedAt: null,
      validatedAt: null,
      paidAt: null,
    };

    // 1. Compute
    pr = PayrunStateMachine.transitionToComputed(pr, 5);
    expect(pr.status).toBe("computed");
    expect(pr.computedAt).not.toBeNull();

    // 2. Validate
    pr = PayrunStateMachine.transitionToValidated(pr, []);
    expect(pr.status).toBe("validated");
    expect(pr.validatedAt).not.toBeNull();

    // 3. Mark Paid
    pr = PayrunStateMachine.transitionToPaid(pr);
    expect(pr.status).toBe("paid");
    expect(pr.paidAt).not.toBeNull();
  });

  it("blocks skipping steps (draft directly to validated or paid)", () => {
    const draftPr: MockPayrun = {
      id: "pr-002",
      status: "draft",
      computedAt: null,
      validatedAt: null,
      paidAt: null,
    };

    expect(() => PayrunStateMachine.transitionToValidated(draftPr, [])).toThrow(
      "Only computed payruns can be validated"
    );
    expect(() => PayrunStateMachine.transitionToPaid(draftPr)).toThrow(
      "Only validated payruns can be marked as paid"
    );
  });

  it("blocks validation when unresolved blocking errors exist", () => {
    const computedPr: MockPayrun = {
      id: "pr-003",
      status: "computed",
      computedAt: new Date(),
      validatedAt: null,
      paidAt: null,
    };

    const warnings: MockWarning[] = [
      {
        id: "w-1",
        payrunId: "pr-003",
        severity: "warning",
        resolved: false,
        message: "Employee worked on a declared holiday",
      },
      {
        id: "w-2",
        payrunId: "pr-003",
        severity: "error",
        resolved: false,
        message: "Missing mandatory bank account number",
      },
    ];

    expect(() => PayrunStateMachine.transitionToValidated(computedPr, warnings)).toThrow(
      "blocking error(s) must be resolved first"
    );

    // After resolving the error, validation succeeds
    warnings[1].resolved = true;
    const validatedPr = PayrunStateMachine.transitionToValidated(computedPr, warnings);
    expect(validatedPr.status).toBe("validated");
  });

  it("enforces immutability: validated and paid payruns cannot be recomputed or modified", () => {
    const validatedPr: MockPayrun = {
      id: "pr-004",
      status: "validated",
      computedAt: new Date(),
      validatedAt: new Date(),
      paidAt: null,
    };

    expect(() => PayrunStateMachine.transitionToComputed(validatedPr, 10)).toThrow(
      "Cannot recompute payrun in validated status. It is immutable."
    );

    const paidPr: MockPayrun = {
      id: "pr-005",
      status: "paid",
      computedAt: new Date(),
      validatedAt: new Date(),
      paidAt: new Date(),
    };

    expect(() => PayrunStateMachine.transitionToComputed(paidPr, 10)).toThrow(
      "Cannot recompute payrun in paid status. It is immutable."
    );
    expect(() => PayrunStateMachine.cancelPayrun(paidPr)).toThrow(
      "Cannot cancel a paid payrun"
    );
  });
});
