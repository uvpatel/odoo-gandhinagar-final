# PeoplePay360 Frontend Rules

> **Purpose:** This document is the source of truth for implementing the PeoplePay360 HR & Payroll frontend.  
> **Scope:** Authentication, Employees & Contracts, Working Schedules, Attendance, Time Off, Payroll, Salary Structures & Rules, Payslips, and Payroll Dashboard.

---

## 1. Core Frontend Principles

1. The UI must reflect the actual HR/payroll workflow described in this document.
2. Do not hardcode business results that should come from backend data.
3. Every protected module must respect the logged-in user's roles and permissions.
4. Users must only see actions and records allowed by their assigned roles.
5. Forms should validate required fields before submission.
6. Destructive or financially significant actions should require confirmation.
7. Loading, empty, success, and error states must be handled for every data-driven screen.
8. Historical payroll data must remain accessible after payroll is finalized/paid.
9. Reuse shared components for tables, forms, dialogs, filters, status badges, pagination, and notifications.
10. The frontend must never assume that hiding a button is sufficient authorization; the backend remains the final authority.

---

# 2. Authentication & User Access

## 2.1 User Creation

- User accounts are created by an Admin.
- When creating a user, the Admin must link the account to the relevant Employee.
- Admin must assign one or more roles to the user.
- The employee-to-user relationship should be clearly visible when managing users.

## 2.2 Role-Based Access

- Roles determine which modules, records, and actions are available after login.
- Users cannot assign themselves roles.
- Users cannot elevate their own permissions.
- Frontend navigation should hide modules the current user cannot access.
- Direct route access must also be protected.
- Action buttons such as Create, Edit, Delete, Approve, Compute, Validate, and Mark Paid must be permission-aware.
- Record-level access must be respected where applicable.

## 2.3 Login

- Successful login redirects the user to the appropriate dashboard.
- Failed authentication displays a clear error without exposing sensitive information.
- The current user's identity and role context should be available to the frontend.
- Session state must be maintained consistently across protected routes.

## 2.4 Optional Authentication Enhancements

These are enhancements and are not mandatory for the core flow:

- Password reset
- User invitations
- SSO
- Additional authentication providers

---

# 3. Employee & Contract Module

## 3.1 Employee List

Employees must be available in:

- List view
- Kanban view

The user should be able to switch between the two views without losing relevant filters/context.

## 3.2 Employee List Information

The employee list should provide useful employee information and support opening an employee record.

At minimum, the employee area should support access to:

- Employee identity
- Employment information
- Company
- Department where applicable
- Contract information
- Attendance
- Time Off
- Allocations

## 3.3 Employee Detail

Opening an employee should show:

- HR details
- Related contracts
- Attendance records
- Time Off records
- Allocations

Related records should be scoped to the selected employee.

## 3.4 Contracts

- An employee can have multiple contracts over time.
- Contract history must not overwrite previous contracts.
- The active/applicable contract must be identifiable.
- Payroll must use the contract applicable to the payroll period.
- Contract information should be available from the employee detail page.
- Contract dates should be validated where applicable.

## 3.5 Employee-to-Contract Relationship

Conceptually:

```text
Employee
  ├── Contract(s)
  ├── Attendance
  ├── Time Off
  └── Allocation(s)
```

The frontend should make these relationships easy to navigate.

---

# 4. Working Schedule Module

## 4.1 Required Views

Working Schedules require:

- List view
- Form/detail view

Clicking a schedule row should open that schedule.

## 4.2 Schedule List

The list should surface:

- Schedule name
- Calendar type
- Days/week
- Hours/week
- Company
- Status

## 4.3 Schedule Form

A schedule should define the weekly working pattern, including:

- Working days
- Start time
- End time
- Optional break
- Working hours

Weekly hours should be derived from the configured schedule rather than manually duplicated where possible.

## 4.4 Schedule Assignment

A working schedule can be assigned to:

- Employee
- Contract

The assigned schedule may be consumed by:

- Attendance
- Payroll

## 4.5 Flexible Rules

The exact handling of:

- Shifts
- Flexible time
- Variable schedules
- Other scheduling rules

is open to implementation, provided the schedule remains usable by Attendance and Payroll.

## 4.6 Frontend Rule

Do not build unnecessary scheduling complexity unless it supports the required HR/payroll workflow.

---

# 5. Attendance Module

## 5.1 Access

Attendance can be accessed:

- Globally
- From an individual Employee

## 5.2 Attendance Records

Attendance records should store/display:

- Check-in
- Check-out
- Worked hours
- Attendance status

Worked hours should be derived from check-in/check-out times rather than manually entered when possible.

## 5.3 Employee Attendance View

When Attendance is opened from an Employee:

> Only that employee's attendance should be shown.

Do not display unrelated employees' attendance in an employee-scoped view.

## 5.4 Attendance Widget

The dashboard Attendance Widget should show:

- Welcome message
- User/employee name
- Current attendance state
- Today's worked duration
- Check In / Check Out action

## 5.5 Attendance Quick Action

When the user clicks the attendance icon:

- Open the Check In / Check Out popup.

Popup behavior:

- If there is no active session, show **Check In**.
- If the employee is already checked in, show **Check Out**.
- Show elapsed time while the attendance session is active.
- After successful Check In, the status indicator changes to green.
- After successful Check Out, update the displayed attendance state and duration.

## 5.6 Attendance Data Usage

Attendance data must be structured so it can later support:

- Reporting
- Dashboard insights
- Payroll calculations where applicable

---

# 6. Time Off Module

## 6.1 Leave Requests

Time Off requests must support a simple approval workflow:

```text
Requested → Approved
          ↘ Rejected
```

The exact workflow can be extended if needed, but it must remain understandable.

## 6.2 Leave Types

Each Time Off type should define how it behaves.

Examples of configurable behavior may include:

- Requires allocation
- Does not require allocation
- Approval behavior
- Balance impact

## 6.3 Leave Allocation

For leave types that require allocation:

- Approved leave must reduce the employee's available balance.
- Available balance should be visible to the employee/authorized users.
- The frontend should not allow approval that would create an invalid balance unless the business rule explicitly permits it.

## 6.4 Leave Request UI

A request should provide:

- Employee
- Leave type
- Start date
- End date / duration
- Reason where applicable
- Current status
- Approval/rejection action for authorized users

## 6.5 Status Rules

Use clear status indicators for:

- Pending
- Approved
- Rejected
- Cancelled, if implemented

The exact policies and validations are open to interpretation, but the approval and allocation behavior above is mandatory.

---

# 7. Payroll Module

## 7.1 Payroll Creation

Payroll creation happens in two steps.

### Step 1 — Select Payroll Scope

The user selects:

- Employee type
- Salary structure
- Payroll period

### Step 2 — Select Employees

The user selects the employees to include.

A payroll is created only after the user clicks:

> **Create Payroll**

Only the selected employees should be included.

## 7.2 Payroll Scope

The frontend should make the selected payroll scope clearly visible before creation.

The user should be able to review:

- Period
- Employee type
- Salary structure
- Selected employees

before confirming creation.

## 7.3 Payroll Record

A Payroll represents payroll processing for a particular period.

Each employee in the payroll should have a corresponding payslip.

Each payslip should use:

- The applicable contract
- The selected salary structure
- Relevant payroll inputs

## 7.4 Payslip Calculation Display

Payslips should clearly expose:

- Basic Salary
- Allowances
- Deductions
- Gross Salary
- Net Salary
- Other applicable salary rules

The calculation should be understandable from the payslip UI.

---

# 8. Payroll Workflow

The required payroll lifecycle is:

```text
Draft
  ↓
Compute
  ↓
Validate
  ↓
Mark Paid
```

## 8.1 Draft

- Payroll can be reviewed and edited according to permissions.
- Employees included in the payroll should be visible.
- Payslip records should be accessible.

## 8.2 Compute

- Payroll calculations are generated from the applicable contract and salary structure/rules.
- Computation should use actual configured values.
- Calculation errors must be surfaced clearly.

## 8.3 Validate

- Authorized users can validate the computed payroll.
- Validation should prevent accidental modification of finalized payroll data.
- Invalid/missing required payroll information should be shown before validation.

## 8.4 Mark Paid

- Authorized users can mark validated payroll as paid.
- Paid/finalized payroll becomes historical data.
- Paid payroll must remain viewable.

## 8.5 Payroll Errors

The UI should make issues visible, including:

- Missing required information
- Invalid salary configuration
- Duplicate payslips
- Calculation failures

Errors should identify the affected payroll/payslip where possible.

---

# 9. Salary Structures & Salary Rules

## 9.1 Salary Structure

A Salary Structure contains the rules used to calculate salary.

The frontend should support:

- Structure name
- Applicable rules
- Rule ordering/sequence
- Active/inactive state where applicable

## 9.2 Salary Rules

Salary Rules may represent:

- Basic Salary
- Allowances
- Deductions
- Gross Salary
- Net Salary
- Other payroll components

## 9.3 Rule Sequence

Rules must be processed according to their sequence.

The frontend must clearly expose the rule order because calculation order affects results.

## 9.4 Calculation Methods

Salary rules may use:

1. Fixed Amount
2. Percentage
3. Python Code / Formula

---

# 10. Salary Rule Calculation Rules

## 10.1 Fixed Amount

Use the exact value configured in the rule.

Example:

```text
Meal Allowance = ₹2,000
```

The resulting amount is ₹2,000.

## 10.2 Percentage

Calculate the rule as a percentage of a selected base.

Possible bases include:

- Contract Wage
- Basic Salary
- Gross Salary

Example:

```text
HRA = 20% × Basic Salary
```

## 10.3 Python Code / Formula

Use advanced formulas when fixed amount or percentage is insufficient.

Possible use cases:

- Attendance-based salary
- Overtime
- Unpaid leave deductions
- Calculations depending on multiple salary rules
- Complex payroll formulas

The exact calculation engine implementation is open, but configured salary rules must actually drive the payslip calculation.

## 10.4 Frontend Rule

The frontend should configure and display calculation rules; it should not independently reproduce the authoritative payroll calculation engine.

The backend should remain the source of truth for calculated payroll values.

---

# 11. Payslip Module

## 11.1 Payslip Relationship

Conceptually:

```text
Payroll
  └── Payslip(s)
        └── Employee
        └── Contract
        └── Salary Structure
        └── Salary Rules
```

## 11.2 Payslip Display

A payslip should show the employee's payroll calculation for the relevant period.

At minimum:

- Employee
- Payroll period
- Contract
- Salary structure
- Earnings
- Allowances
- Deductions
- Gross
- Net

## 11.3 Payslip PDF

Users should be able to:

- Generate a payslip PDF
- Print the payslip

The generated payslip must represent the calculation stored for that payroll.

## 11.4 Historical Payslips

Payslips associated with paid/finalized payroll must remain accessible as historical records.

---

# 12. Payroll Dashboard

## 12.1 Data Source

The Payroll Dashboard must use:

> **Actual data created through HR and Payroll flows.**

Do not use fake/static KPI values in the production dashboard.

## 12.2 Dashboard Insights

The dashboard should provide useful HR/payroll insights such as:

- Salary totals
- Payslip status
- Salary by department
- Salary trends
- Attendance overview
- Time Off overview
- Payroll warnings/items requiring attention

## 12.3 Filters

Dashboard filters may include:

- Period
- Department
- Employee Type
- Company

Filters must affect the relevant dashboard data.

## 12.4 Dashboard Consistency

Dashboard values should be derived from the same underlying records used by:

- Employees
- Contracts
- Attendance
- Time Off
- Payroll
- Payslips

Avoid having separate frontend-only numbers.

---

# 13. Navigation Rules

Recommended top-level application structure:

```text
Dashboard
├── HR
│   ├── Employees
│   ├── Contracts
│   └── Working Schedules
│
├── Attendance
│
├── Time Off
│   ├── Requests
│   └── Allocations
│
└── Payroll
    ├── Payroll Runs
    ├── Payslips
    ├── Salary Structures
    └── Salary Rules
```

Navigation must be role-aware.

If a user has no permission for a module:

- Hide the module from navigation.
- Block direct route access.
- Prevent unauthorized actions.

---

# 14. Forms & Validation

## Required Frontend Behavior

- Show required fields clearly.
- Validate obvious client-side errors before API submission.
- Preserve entered values when possible after validation errors.
- Disable submit while an operation is in progress.
- Show server-side validation errors returned by the API.
- Confirm important irreversible operations.

## Financial Operations

Extra care is required for:

- Create Payroll
- Compute Payroll
- Validate Payroll
- Mark Paid
- Approve Time Off
- Reject Time Off

---

# 15. Tables & List Views

All major list pages should support, where applicable:

- Search
- Filtering
- Sorting
- Pagination
- Loading state
- Empty state
- Error state
- Row navigation

Do not load unrelated records into employee-specific views.

---

# 16. Status UI Rules

Use consistent status badges across the application.

Examples:

```text
Employee: Active / Inactive

Contract: Draft / Active / Expired

Attendance: Checked In / Checked Out

Time Off: Pending / Approved / Rejected

Payroll: Draft / Computed / Validated / Paid

Payslip: Draft / Computed / Finalized
```

Exact status names may follow the backend enum definitions.

---

# 17. State Management

Use server-state management for API data.

Recommended separation:

```text
TanStack Query
    ↓
Server/API state
Employees
Attendance
Time Off
Payroll
Payslips
Schedules

Zustand
    ↓
Client/UI state
Sidebar state
Filters where appropriate
Modal state
Temporary UI preferences
Wizard state where appropriate
```

Do not duplicate server records unnecessarily in Zustand.

---

# 18. API Integration

The frontend should communicate with the backend through typed API functions/services.

For mutations:

```text
User Action
   ↓
Form Validation
   ↓
API Request
   ↓
Success / Error
   ↓
Invalidate or update affected queries
   ↓
Refresh UI
```

After mutations, related cached data must be invalidated or updated so the UI reflects the latest backend state.

Examples:

- Check In → refresh attendance
- Check Out → refresh attendance
- Approve Leave → refresh request + balance
- Create Payroll → refresh payroll list
- Compute Payroll → refresh payroll + payslips
- Mark Paid → refresh payroll + historical data

---

# 19. Error Handling

Every API-driven page must account for:

### Loading

Show skeleton/spinner/progress UI.

### Empty

Explain what is missing and provide an appropriate action where possible.

### Error

Show a human-readable error and allow retry where appropriate.

### Success

Show confirmation for important mutations.

Never silently fail a payroll, attendance, leave, or approval operation.

---

# 20. Permissions Matrix

The actual roles should come from the configured RBAC system. A conceptual matrix is:

| Action | Admin | HR/Payroll Authorized User | Manager | Employee |
|---|---:|---:|---:|---:|
| Create User | ✓ | Configurable | ✗ | ✗ |
| Assign Roles | ✓ | Configurable | ✗ | ✗ |
| View Employees | ✓ | ✓ | Team/Allowed | Own |
| Manage Contracts | ✓ | ✓ | Configurable | Read Own |
| Manage Schedules | ✓ | ✓ | Configurable | Read |
| View Attendance | ✓ | ✓ | Team/Allowed | Own |
| Check In/Out | ✓ | ✓ | ✓ | Own |
| Create Time Off | ✓ | ✓ | ✓ | Own |
| Approve Time Off | ✓ | ✓ | ✓/Team | ✗ |
| Manage Allocations | ✓ | ✓ | Configurable | Read Own |
| Create Payroll | ✓ | ✓ | ✗ | ✗ |
| Compute Payroll | ✓ | ✓ | ✗ | ✗ |
| Validate Payroll | ✓ | Authorized | ✗ | ✗ |
| Mark Paid | ✓ | Authorized | ✗ | ✗ |
| View Payslip | ✓ | ✓ | Configurable | Own |
| Generate Payslip PDF | ✓ | ✓ | Configurable | Own |
| Manage Salary Rules | ✓ | Authorized | ✗ | ✗ |
| View Payroll Dashboard | ✓ | ✓ | Configurable | Limited |

> This table is a frontend permission guideline. The actual permissions must be resolved from the backend/RBAC configuration.

---

# 21. Security Rules

1. Never trust client-side permission checks as authorization.
2. Never expose sensitive payroll information to unauthorized users.
3. Do not place secrets/API keys in frontend code.
4. Do not store sensitive authentication data in insecure client-side storage.
5. Avoid exposing unnecessary employee/payroll data in URLs or logs.
6. Handle session expiration gracefully.
7. Redirect unauthorized users to an appropriate page.
8. Backend authorization is always authoritative.

---

# 22. UX Rules

## Employee Experience

An employee should be able to quickly access:

- Attendance
- Check In / Check Out
- Time Off
- Leave balance
- Own payslips

## HR/Payroll Experience

HR/payroll users should be able to quickly access:

- Employees
- Contracts
- Schedules
- Attendance
- Time Off
- Payroll
- Payslips
- Salary configuration
- Dashboard insights

## Admin Experience

Admins should be able to manage:

- Users
- Roles
- Access
- HR/payroll configuration

---

# 23. Important Business Flows

## 23.1 User Access Flow

```text
Admin
  ↓
Create User
  ↓
Link Employee
  ↓
Assign Role(s)
  ↓
User Login
  ↓
RBAC Resolution
  ↓
Allowed Modules / Records / Actions
```

## 23.2 Employee Flow

```text
Create Employee
  ↓
Create/Assign Contract
  ↓
Assign Working Schedule
  ↓
Employee uses Attendance
  ↓
Employee requests Time Off
  ↓
Approved Time Off affects balance
  ↓
Payroll uses applicable contract/schedule/data
```

## 23.3 Attendance Flow

```text
Dashboard Widget
  ↓
Click Attendance Icon
  ↓
Check In / Check Out Popup
  ↓
Check In
  ↓
Elapsed Time
  ↓
Check Out
  ↓
Attendance Record
  ↓
Reporting / Dashboard / Payroll Inputs
```

## 23.4 Time Off Flow

```text
Employee
  ↓
Create Request
  ↓
Pending
  ↓
Manager/HR Approval
  ├── Approved → Reduce Allocation Balance (when required)
  └── Rejected
```

## 23.5 Payroll Flow

```text
Select Scope
  ↓
Select Employees
  ↓
Create Payroll
  ↓
Draft
  ↓
Compute
  ↓
Generate/Update Payslips
  ↓
Validate
  ↓
Mark Paid
  ↓
Historical Payroll
```

---

# 24. Frontend Architecture Rules

Recommended structure:

```text
src/
├── app/
│   ├── (auth)/
│   └── (dashboard)/
│
├── components/
│   ├── ui/
│   ├── forms/
│   ├── tables/
│   ├── dialogs/
│   └── charts/
│
├── features/
│   ├── auth/
│   ├── employees/
│   ├── contracts/
│   ├── schedules/
│   ├── attendance/
│   ├── time-off/
│   ├── payroll/
│   ├── payslips/
│   └── dashboard/
│
├── lib/
│   ├── api/
│   ├── auth/
│   ├── permissions/
│   └── utils/
│
└── stores/
```

Keep business-specific components close to their feature.

Use shared components only for genuinely reusable UI behavior.

---

# 25. Definition of Done

A module is considered frontend-complete when:

- [ ] Required routes exist.
- [ ] Required list/form/detail views exist.
- [ ] RBAC visibility is implemented.
- [ ] Route protection is implemented.
- [ ] API integration is complete.
- [ ] Loading state exists.
- [ ] Empty state exists.
- [ ] Error state exists.
- [ ] Form validation exists.
- [ ] Mutation success feedback exists.
- [ ] Related queries refresh after mutations.
- [ ] Important destructive/financial actions require confirmation.
- [ ] Mobile/responsive behavior is acceptable.
- [ ] No production business data is hardcoded.
- [ ] Historical payroll/payslip data remains accessible.
- [ ] UI reflects the actual backend state.

---

# 26. Non-Negotiable Business Rules

1. **Admin creates user accounts.**
2. **Every user account is linked to the relevant employee.**
3. **Users receive one or more roles.**
4. **Users cannot elevate their own roles.**
5. **Employees are available in both List and Kanban views.**
6. **Employees can have multiple contracts over time.**
7. **Payroll uses the contract applicable to the payroll period.**
8. **Working Schedules have List and Form views.**
9. **Schedules define the weekly working pattern.**
10. **Schedules can be assigned to Employees or Contracts.**
11. **Attendance supports Check In and Check Out.**
12. **Employee-scoped attendance only shows that employee's records.**
13. **Attendance data must support later reporting/dashboard use.**
14. **Time Off supports an approval flow.**
15. **Approved allocated leave reduces available balance.**
16. **Payroll creation requires scope selection and employee selection.**
17. **Only selected employees are included in a created payroll.**
18. **Each payroll employee has a payslip.**
19. **Payslips use the applicable contract and salary structure.**
20. **Payroll follows Draft → Compute → Validate → Mark Paid.**
21. **Paid/finalized payroll remains available as historical data.**
22. **Salary rules are processed according to sequence.**
23. **Salary rules drive actual payslip calculations.**
24. **Fixed, percentage, and advanced formula calculations are supported.**
25. **Payslip PDF generation/printing is available.**
26. **Payroll dashboard uses actual HR/payroll data.**
27. **Dashboard filters affect the relevant data.**
28. **Frontend permission checks never replace backend authorization.**

---

## 27. Implementation Priority

### P0 — Must Work

- Authentication
- RBAC
- Employee management
- Contracts
- Working Schedules
- Attendance Check In/Out
- Time Off requests + approval
- Payroll creation
- Payroll computation workflow
- Payslips
- Salary Structures & Rules
- Payroll Dashboard

### P1 — Important UX

- Kanban employee view
- Advanced filters
- Search/sort/pagination
- PDF/print experience
- Dashboard charts
- Better empty/loading/error states
- Responsive layouts

### P2 — Enhancements

- Password reset
- Invitations
- SSO
- Advanced flexible scheduling
- Additional reporting
- Advanced payroll formula UX

---

> **Final Rule:** The frontend is an interaction layer over the HR/payroll domain. It should make the workflow simple and clear, while the backend remains the source of truth for authorization, payroll calculations, balances, and persisted business state.