# PeoplePay360 Requirements-to-Code Audit

Audit date: 2026-09-05

## Executive assessment

The repository has a strong breadth-first MVP: the core database domains exist, most operational list screens exist, RBAC roles are modeled, and the payrun wizard, period contract lookup, ordered salary engine, payslip workflow, and live payroll dashboard have meaningful implementations.

It is not yet a complete implementation of the problem statement. The documentation in `docs/ROADMAP.md` overstates Phase 1 completion. Several routes and whole report pages are placeholders, important configuration is not connected to operational behavior, and critical authorization and payroll-integrity gaps remain.

Overall assessment (based on requirements, not file count):

| Area | Status | Approximate completeness |
|---|---|---:|
| Authentication and RBAC model | Partial, critical security issue | 60% |
| Employee master | Partial | 65% |
| Contracts | Partial | 70% |
| Working schedules | Mostly UI shell | 35% |
| Attendance | Partial | 60% |
| Time off | Partial, integrity gaps | 50% |
| Salary structures | Missing UI/integration management | 25% |
| Salary rules | Partial | 70% |
| Payruns and payslips | Substantial, not production-safe | 75% |
| PDF and email delivery | Partial | 45% |
| Dashboard and reports | Dashboard partial; reports missing | 45% |
| Tests and release readiness | Missing | 10% |

## P0: must fix before a live demo or shared deployment

### 1. Public privilege escalation during signup

The signup form lets a visitor select `hr_manager`, payroll roles, or `admin`, submits that value to Better Auth, and the auth configuration accepts `role` as an input field. A visitor can therefore create an administrator account.

Required change:

- Remove role selection from public signup.
- Do not accept `role` as client-controlled signup input; always create users as `employee` (or use invite-only provisioning).
- Keep role changes exclusively in the administrator API, with audit logging.
- Add authorization tests that attempt privilege escalation through signup payloads.

### 2. Payroll dashboard salary data is exposed to ordinary employees

`GET /api/payroll/dashboard` checks `dashboard:view`. The employee role has that permission, so an employee can call the endpoint directly even though `/payroll` is hidden by route rules. The response contains company salary totals, department costs, missing-bank alerts, and payroll status.

Required change: require `report:payroll` or a dedicated `payrollDashboard:read` permission on the API. Page redirects and hidden navigation are not security boundaries.

### 3. Time-off allocation mutations lack permission checks

Allocation `POST`, `PUT`, and `DELETE` only require authentication. Any logged-in employee can directly create approved balances, alter balances/statuses, or delete allocations by calling the API.

Required change: enforce `timeOffAllocation:create/update/delete`, validate workflow transitions, and set approval metadata only when an authorized approver actually approves.

### 4. Payroll and leave mutations are not transactional

`createPayrunTransaction` is named transactional but inserts a payrun and then inserts payslips one at a time without a database transaction. Compute, validate, mark-paid, leave approval, and multi-record admin operations have the same partial-write risk.

Required change: wrap each aggregate workflow in a Drizzle transaction and make transitions idempotent. A failure must not leave a half-created or half-paid payroll batch.

## Requirements gap matrix

### Employee master management

Implemented:

- Employee table, department, job position, manager, employee type, status, bank fields, and CRUD API.
- Table and card/grid views.
- Department and job-position configuration screens.

Remaining or incomplete:

- There is no unified employee detail/form route acting as the operational hub; editing is a modal on the list page.
- No smart buttons/counts linking to filtered Contracts, Attendance, Time Off, and Allocations.
- The dynamic employee detail and related-record APIs are placeholder success responses.
- Employees cannot view a dedicated “My Profile” page.
- Working schedule exists in the employee schema but is absent from the employee API projection and form.
- Employee history is seeded and has query helpers, but normal employee updates do not create history records and no history UI exists.
- Generated employee numbers use `count + 1`, which is race-prone and can collide after deletion/concurrent creation.

### Contract management

Implemented:

- Historical contract records, list/form modal, wage/dates/status, department, position, working schedule, and period-overlap contract resolution.
- Payroll eligibility detects zero, one, or multiple overlapping active contracts.

Remaining or incomplete:

- Contract create/update does not prevent overlapping active contracts; the problem is only discovered later in payroll.
- The contract form does not allow salary structure selection even though the API/schema field exists.
- `contracts.salaryStructureId` has no database foreign-key constraint.
- Dynamic contract detail route is a placeholder.
- Status is manually maintained; expiry is not derived/reconciled from dates.
- Destructive deletion can remove history instead of preserving finalized employment records; define archive/terminate rules.

### Working schedules

Implemented:

- Schedule and schedule-line tables exist.
- Schedule header CRUD and a configuration screen exist.

Remaining or incomplete:

- The API never reads or writes `working_schedule_lines`.
- Form values for workdays, start/end, and break are display-only and are not submitted.
- List values are hardcoded to “5 Days” and “40.0 hrs / week (09:00 - 18:00)”.
- Weekly hours are calculated only in client state, not from persisted schedule lines.
- Attendance checkout uses a fixed 480-minute overtime threshold and does not use the assigned schedule, breaks, timezone, lateness window, or expected hours.
- Add constraints for valid weekday, `end > start`, nonnegative breaks, and unique schedule/day/segment.

### Attendance

Implemented:

- Global list/form, employee self check-in/out, calculated worked minutes, basic overtime, status, and exception screen.
- One attendance row per employee/day is protected by a database unique constraint.

Remaining or incomplete:

- Attendance detail and correction endpoints are placeholders.
- The exception UI directly updates attendance; it does not create or approve `attendance_corrections`, so old/new values and approver history are lost.
- “Correct” permission exists but the UI/API uses general `attendance:update` instead.
- Manual creation/update does not consistently subtract schedule breaks or recompute overtime/status.
- No schedule-derived late/absent/missing-checkout generation.
- Date filtering supports one date, not the specified date range and department filters.
- Check-in date uses UTC rather than the employee/schedule timezone, which can assign records to the wrong local day.

### Time off types, allocations, and requests

Implemented:

- Types, allocations, request screens, self-service request screen, approve/refuse actions, and calculated balance display.
- Paid/unpaid, unit, allocation requirement, and approval mode fields exist in the type model.

Remaining or incomplete:

- Request creation trusts client-supplied duration instead of calculating it from dates, unit, schedule, holidays, and partial days/hours.
- No validation for invalid dates, overlapping requests, inactive types, negative duration, or requests outside employment dates.
- Approval does not check `requiresAllocation`, available balance, allocation validity, or allocation ownership.
- Approval mode (`none`, manager, HR, manager-and-HR) is stored but ignored; every approval is a single step.
- Approval does not link a request to an allocation or record a balance-consumption ledger transaction.
- Balance queries ignore allocation/request validity windows. The allocation list applies the same total consumed amount to every allocation of the same employee/type, producing incorrect per-allocation remaining balances.
- Self-cancellation can cancel an already approved request without a reversal workflow or approval-state guard.
- Allocations default to approved in the API, bypassing the requirement that balances become available only after approval.
- Allocation description is collected in the UI but not present/persisted in the schema/API.

### Salary structures and salary rules

Implemented:

- Salary rule CRUD UI/API supports category, code, sequence, fixed, percentage, formula, and active status.
- Structure, rule, and structure-rule tables exist; payroll loads active linked rules in sequence.
- Payroll-user read-only permissions versus payroll-manager CRUD permissions are correctly modeled.

Remaining or incomplete:

- Salary Structures page is a placeholder.
- Structure API only CRUDs the header; there is no API/UI to add/remove/reorder `salary_structure_rules`.
- Structure list does not show rule count, employee count, active details, or a form view.
- The formula engine only substitutes earlier rule codes and `WAGE`; attendance and leave context is collected but cannot be referenced and has no effect on salary.
- Rule configuration lacks strict Zod validation, dependency validation, duplicate sequence handling, divide-by-zero/non-finite handling, and useful formula error feedback. Invalid formulas silently compute zero.
- Structure-link sequence is used to order rules, but the engine outputs each rule’s global sequence instead of the structure-specific sequence.
- Payrun selection says one structure, but computation prefers the contract’s different structure when present. Define and enforce one rule: either the selected payrun structure dictates computation, or mismatched employees are ineligible.

### Payrun and payslip workflow

Implemented:

- Two-step wizard holds scope in client state before creation and supports explicit employee selection.
- Period-specific contract eligibility and conflict detection.
- Draft payslips, ordered computation lines, compute → validate → paid transitions, warnings, detail/list screens, and historical statuses.
- Database uniqueness prevents duplicate employee entries inside one payrun.

Remaining or incomplete:

- Selected ineligible employee IDs are silently skipped during creation; the API can return success with fewer payslips than requested.
- No duplicate-payslip detection across different payruns for the same employee and overlapping payroll period.
- Missing contract conflicts are not prevented at source.
- Computation gathers attendance and paid/unpaid leave but base salary is not prorated and rules cannot consume those values.
- Warnings cover missing bank, inactive employee, no contract, negative net, and zero salary, but not duplicate periods, contract mismatch, missing structure/rules, incomplete attendance, missing checkout, or invalid employee data.
- There is no supported warning-resolution workflow even though warnings have a `resolved` field.
- Finalized/paid immutability is incomplete: protect records at service and database/API levels from update/delete/recompute.
- Payroll calculations do not snapshot rule definitions/formulas. Editing a rule and recomputing changes history; finalized payroll needs immutable calculation inputs/versions.
- No rounding policy, currency consistency validation, tax/statutory configuration, or effective-dated salary revision model.

### Payslip PDF and email delivery

Implemented:

- Printable payslip HTML and individual/bulk Resend delivery logic.

Remaining or incomplete:

- The `/pdf` endpoint returns `text/html` with an `.html` filename, not a PDF.
- Bulk email sends a summary body but no PDF attachment or secure payslip link.
- Email sender is fixed to `payroll@resend.dev`; production sender/config validation is missing.
- Sending is sequential in the request lifecycle, without job queue, retry, delivery log/status, idempotency key, or per-recipient result persistence.
- HTML interpolation needs escaping to prevent stored content from becoming email/print markup.

### Payroll dashboard and reports

Implemented:

- Payroll dashboard uses live database queries for KPI cards, department costs, monthly trends, alerts, attendance, and leave overview.
- Department filter is exposed in the UI.

Remaining or incorrect:

- Period and employee-type filters required by the statement are absent from the UI; `employeeType` is accepted by the service type but ignored.
- Filters are only applied to the first payslip KPI query. Department costs, trends, draft runs, alerts, attendance, and time-off totals ignore the selected filters.
- Attendance “absent” is hardcoded to zero; coverage is defined as `(records - late) / records`, not actual scheduled attendance coverage.
- Paid leave is set equal to all approved leave and unpaid leave is hardcoded to zero.
- Department costs include all payslip statuses and all time periods, which can mix draft, computed, and paid amounts.
- Monthly “last six months” uses ascending order plus `limit(6)`, yielding the earliest six recorded months rather than the latest six.
- Duplicate payslip and contract-attention alerts are absent.
- `/dashboard` is visually empty and `/dashboard/analytics` plus all five report pages are placeholders.

### Administration and authorization

Implemented:

- Central role definitions closely match Employee, HR Manager, Payroll User, Payroll Manager, and Admin requirements.
- Route gating, server permission helpers, client visibility helpers, and admin user CRUD/role assignment exist.
- Payroll User correctly has no delete permission for payruns/payslips and read-only salary configuration.

Remaining or incomplete:

- Fix the P0 signup privilege escalation.
- Fix direct-API authorization gaps; several dynamic routes are unauthenticated placeholders, and some list/config APIs rely on manual role-name checks instead of central permissions.
- “Roles & Permissions” is an explanatory static matrix, not editable permission updates as requested. If fixed roles are intentional, document that role assignment—not permission editing—is supported.
- No audit log for role, employee, contract, attendance, leave, or payroll changes.
- Add CSRF/trusted-origin/rate-limit/session hardening and security tests before production use.

## Placeholder inventory

The following are present as routes but not functional implementations:

- Employee detail and employee-related Contracts/Attendance/Time Off APIs.
- Contract, department, job-position, working-schedule, time-off-request, attendance, and attendance-correction dynamic detail APIs.
- Generic dashboard API.
- Salary Structures page.
- Reports landing, Payroll, Attendance, Time Off, and Department Costs pages.
- Dashboard Analytics page.

## Code and release quality

- `tsc --noEmit` passes.
- `npm run lint` fails with **169 errors and 143 warnings** (312 findings).
- No unit, integration, or end-to-end test files were found.
- There is no test script in `package.json`.
- API input validation is inconsistent: payrun creation uses Zod, but most CRUD endpoints accept unchecked JSON and cast enum/numeric/date values.
- Error response shapes are inconsistent with the documented API convention.
- The code duplicates payroll computation in two services, increasing drift risk.
- Many client pages are large monolithic components with manual fetch/state logic; reusable forms, schemas, query keys, and domain clients would reduce defects.

## Recommended implementation order

### Milestone 1 — security and data integrity

1. Lock signup role to employee/invite-only and secure the payroll-dashboard API.
2. Enforce central permission checks on every API method, especially allocations and corrections.
3. Add Zod schemas and domain transition guards to all mutations.
4. Add database transactions and idempotency to payrun, approval, paid, and admin aggregate operations.
5. Add overlap/duplicate constraints and service checks for contracts, leave, and payroll periods.

### Milestone 2 — complete the two demo workflows

1. Persist working schedule lines and derive weekly hours, breaks, lateness, and overtime.
2. Implement allocation-validity/balance checking and transactional request approval/consumption.
3. Build Salary Structure list/form and rule membership/reordering.
4. Make selected structure and period-valid contract behavior explicit and consistent.
5. Generate a real PDF and attach/deliver it with recorded email results.

### Milestone 3 — unified operational experience

1. Build employee detail hub with smart counts and filtered related-record links.
2. Implement audited attendance corrections.
3. Complete dashboard filters and correct every aggregate to share one filter scope.
4. Replace report/dashboard placeholder pages with live views or remove them from navigation until ready.

### Milestone 4 — verification and hardening

1. Unit-test contract resolution, duration/balance logic, schedule hours, salary sequence/formulas, rounding, and warning rules.
2. Integration-test RBAC and every workflow transition.
3. Add end-to-end tests for employee → contract → payrun → payslip and allocation → request → approval → reduced balance.
4. Resolve lint failures, add CI for lint/typecheck/tests/build, and add audit/observability/email retry support.

## Demo readiness verdict

The payrun UI can support a convincing seeded-data walkthrough, but the solution should not be described as a fully functional end-to-end implementation yet. For an honest hackathon demo, present the current payroll flow as the strongest completed slice and clearly label Working Schedules, allocation enforcement, Salary Structures, real PDF delivery, and Reports as incomplete. Fix the three P0 authorization issues before allowing anyone outside the team to use the deployment.
