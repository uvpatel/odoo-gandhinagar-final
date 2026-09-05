# PeoplePay360 Architecture

## 1. Overview

PeoplePay360 is a modular HR and Payroll platform designed around connected business domains.

The architecture separates:

* Presentation
* Application workflows
* Business/domain logic
* Data access
* Infrastructure integrations

The central architectural principle is:

> **Business configuration drives operational behavior.**

Salary Structures and Salary Rules should determine payroll computation rather than hardcoded salary logic.

---

# 2. High-Level Architecture

```text
                    ┌──────────────────────┐
                    │      Next.js UI      │
                    │ React + shadcn/ui    │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Application Layer    │
                    │ Actions / API        │
                    │ Validation / Auth    │
                    └──────────┬───────────┘
                               │
                               ▼
       ┌────────────────────────────────────────────┐
       │              Domain Services               │
       │                                            │
       │ Employee │ Contract │ Attendance           │
       │ Time Off │ Payroll │ Salary Rules          │
       └──────────────────────┬─────────────────────┘
                              │
                              ▼
                    ┌──────────────────────┐
                    │    Data Access       │
                    │     Drizzle ORM      │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ PostgreSQL / Neon    │
                    └──────────────────────┘
```

---

# 3. Core Domains

## Employee Domain

Employee is the central HR entity.

Relationships include:

```text
Employee
 ├── Department
 ├── Manager
 ├── Job Position
 ├── Working Schedule
 ├── Contracts
 ├── Attendance
 ├── Time Off Requests
 └── Allocations
```

---

## Contract Domain

Contracts represent employment terms over time.

```text
Employee
   │
   ├── Contract A
   │   ├── Start
   │   ├── End
   │   ├── Wage
   │   └── Salary Structure
   │
   └── Contract B
       ├── Start
       ├── End
       ├── Wage
       └── Salary Structure
```

Payroll must select the contract applicable to the payroll period.

---

# 4. Contract Resolution

Given:

```text
employee_id
period_start
period_end
```

The system identifies contracts overlapping the payroll period.

Conceptually:

```text
contract.start_date <= period_end
AND
(contract.end_date IS NULL OR contract.end_date >= period_start)
```

The result must be validated.

Possible outcomes:

```text
0 contracts → ERROR
1 contract  → VALID
>1 contracts → CONFLICT
```

This prevents payroll from silently selecting an incorrect contract.

---

# 5. Working Schedule

Working schedules define expected working patterns.

```text
Working Schedule
 ├── Monday
 │    ├── Start
 │    ├── End
 │    └── Break
 │
 ├── Tuesday
 ├── Wednesday
 ├── Thursday
 ├── Friday
 ├── Saturday
 └── Sunday
```

Weekly hours should be calculated from schedule lines rather than manually entered.

---

# 6. Attendance Domain

Attendance records capture actual employee presence.

```text
Employee
   │
   ▼
Attendance
   ├── Check In
   ├── Check Out
   ├── Worked Hours
   └── Status
```

Example statuses:

```text
PRESENT
LATE
ABSENT
OVERTIME
MISSING_CHECKOUT
MANUAL_CORRECTION
```

Attendance can feed reporting and payroll calculations.

---

# 7. Time Off Domain

Time Off consists of:

```text
Time Off Type
       │
       ▼
Allocation
       │
       ▼
Employee Request
       │
       ▼
Approval
       │
       ▼
Balance Consumption
```

Balance:

```text
Remaining =
Allocated - Approved/Consumed
```

The exact behavior depends on the Time Off Type configuration.

---

# 8. Payroll Domain

Payroll consists of:

```text
Salary Structure
        │
        ▼
Salary Rules
        │
        ▼
Payrun
        │
        ▼
Payslip
        │
        ▼
Salary Lines
```

---

# 9. Salary Rule Engine

Rules execute in sequence.

Example:

```text
Sequence 10
Basic Salary
       ↓
Sequence 20
Housing Allowance
       ↓
Sequence 30
Transport Allowance
       ↓
Sequence 100
Gross Salary
       ↓
Sequence 200
Tax
       ↓
Sequence 300
Other Deductions
       ↓
Sequence 400
Net Salary
```

A rule may depend on previously calculated values.

---

# 10. Payrun Lifecycle

```text
DRAFT
  │
  ▼
COMPUTING
  │
  ▼
COMPUTED
  │
  ▼
VALIDATED
  │
  ▼
PAID
```

Invalid transitions must be rejected.

For example:

```text
DRAFT → PAID
```

should not be allowed without computation and validation.

---

# 11. Payroll Validation

Validation occurs before finalization.

Checks may include:

```text
Employee active?
Contract available?
Contract conflict?
Salary structure available?
Salary rules valid?
Duplicate payslip?
Required payment information available?
Attendance anomalies?
```

Warnings should be surfaced to payroll users.

Critical errors should prevent finalization.

---

# 12. Payslip Immutability

Once payroll has been finalized/paid, historical payroll data should be protected from accidental modification.

Instead of changing historical results, future corrections should use an explicit correction/reprocessing workflow.

This preserves payroll auditability.

---

# 13. Role-Based Authorization

Authorization is evaluated server-side.

```text
Employee
    ↓
Own HR data

HR Manager
    ↓
HR operations

HR Payroll User
    ↓
HR + operational payroll

HR Payroll Manager
    ↓
HR + full payroll configuration

Admin
    ↓
Everything
```

UI visibility is only a user experience feature.

It is not considered a security boundary.

---

# 14. Data Integrity

Important relationships should be enforced through:

* Foreign keys
* Unique constraints
* Check constraints where appropriate
* Transactions
* Server-side validation
* Domain validation

Critical workflows should be transactional.

For example:

```text
Create Payrun
      +
Create Payslips
      +
Create Salary Lines
```

should either complete successfully or fail consistently.

---

# 15. Reporting Architecture

Dashboard metrics should be calculated from actual operational data.

```text
Employees
   │
Contracts
   │
Attendance ──────┐
                 ├──► Reporting Queries ───► Dashboard
Time Off ────────┤
                 │
Payroll ─────────┘
```

No static/mock dashboard values should be used in production workflows.

---

# 16. External Integrations

Potential integrations include:

```text
Better Auth
    ↓
Authentication

Resend
    ↓
Payslip Email

PDF Generator
    ↓
Payslip Documents

Neon
    ↓
PostgreSQL Database
```

External integrations should be isolated behind service modules so they can be replaced independently.

---

# 17. Architectural Principles

PeoplePay360 follows:

* Modular domain boundaries
* Server-side business logic
* Explicit workflow states
* Configuration-driven payroll
* Period-aware data processing
* Role-based authorization
* Transactional critical operations
* Historical record preservation
* Reusable UI components
* Strong input validation
* Auditable payroll calculations
