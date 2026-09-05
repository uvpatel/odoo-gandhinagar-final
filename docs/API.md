# PeoplePay360 API Documentation

## Overview

PeoplePay360 exposes application-level operations for HR, Attendance, Time Off, Payroll, and Reporting.

The API layer is responsible for:

* Authentication
* Authorization
* Input validation
* Business rules
* Database operations
* Workflow transitions

---

# Authentication

Requests requiring protected resources must have a valid authenticated session.

Authentication is handled through the configured authentication provider.

Unauthorized requests should return:

```text
401 Unauthorized
```

Authenticated users without sufficient permissions should receive:

```text
403 Forbidden
```

---

# Response Convention

Successful operations should return structured data.

Example:

```json
{
  "success": true,
  "data": {}
}
```

Validation failures:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data"
  }
}
```

---

# Employees

## List Employees

```text
GET /api/employees
```

Supports filtering by:

```text
department
status
employeeType
search
```

---

## Get Employee

```text
GET /api/employees/:id
```

Returns employee information and relevant operational relationships.

---

## Create Employee

```text
POST /api/employees
```

Required information may include:

```json
{
  "name": "Employee Name",
  "departmentId": "department-id",
  "jobPositionId": "position-id",
  "employeeType": "FULL_TIME"
}
```

---

## Update Employee

```text
PATCH /api/employees/:id
```

---

# Contracts

## List Contracts

```text
GET /api/contracts
```

Filters:

```text
employee
status
startDate
endDate
department
```

---

## Create Contract

```text
POST /api/contracts
```

Example:

```json
{
  "employeeId": "employee-id",
  "startDate": "2026-01-01",
  "endDate": null,
  "wage": 50000,
  "salaryStructureId": "structure-id"
}
```

---

# Attendance

## List Attendance

```text
GET /api/attendance
```

Filters:

```text
employee
dateFrom
dateTo
status
department
```

---

## Create Attendance

```text
POST /api/attendance
```

---

## Update Attendance

```text
PATCH /api/attendance/:id
```

Manual corrections require appropriate authorization.

---

# Time Off

## List Requests

```text
GET /api/time-off/requests
```

---

## Create Request

```text
POST /api/time-off/requests
```

Example:

```json
{
  "employeeId": "employee-id",
  "typeId": "leave-type-id",
  "startDate": "2026-09-10",
  "endDate": "2026-09-12"
}
```

---

## Approve Request

```text
POST /api/time-off/requests/:id/approve
```

Approval should trigger appropriate balance consumption logic.

---

## Refuse Request

```text
POST /api/time-off/requests/:id/refuse
```

---

# Salary Structures

## List Structures

```text
GET /api/payroll/structures
```

---

## Create Structure

```text
POST /api/payroll/structures
```

---

# Salary Rules

## List Rules

```text
GET /api/payroll/rules
```

---

## Create Rule

```text
POST /api/payroll/rules
```

A rule should contain information such as:

```json
{
  "name": "Basic Salary",
  "code": "BASIC",
  "category": "BASIC",
  "sequence": 10,
  "calculationType": "FIXED"
}
```

---

# Payruns

## Create Payrun

Payrun creation follows a two-step process.

### Step 1

```text
POST /api/payroll/payruns/preview
```

Defines:

```text
salaryStructure
period
```

No Payrun should be permanently created during this step.

### Step 2

```text
POST /api/payroll/payruns
```

Creates the Payrun using explicitly selected eligible employees.

---

# Compute Payrun

```text
POST /api/payroll/payruns/:id/compute
```

The system:

1. Resolves applicable contracts.
2. Loads the salary structure.
3. Loads salary rules.
4. Processes rules in sequence.
5. Generates salary lines.
6. Calculates gross and net salary.
7. Creates/updates payslips.

---

# Validate Payrun

```text
POST /api/payroll/payruns/:id/validate
```

Validation checks payroll warnings and blocking errors.

---

# Mark Payrun Paid

```text
POST /api/payroll/payruns/:id/pay
```

Only validated Payruns should be allowed to transition to paid status.

---

# Send Payslips

```text
POST /api/payroll/payruns/:id/send-payslips
```

Generates/distributes payslip documents through the configured email provider.

---

# Payslips

## Get Payslip

```text
GET /api/payroll/payslips/:id
```

---

## Generate PDF

```text
GET /api/payroll/payslips/:id/pdf
```

Access must be authorized.

---

# Dashboard

## Payroll Dashboard

```text
GET /api/reports/payroll
```

Supported filters:

```text
period
department
employeeType
```

Example response:

```json
{
  "totalNetSalaryPaid": 0,
  "payslipsGenerated": 0,
  "averageSalary": 0,
  "approvedTimeOff": 0,
  "attendanceHealth": 0
}
```

---

# Error Codes

Common application errors:

| Code                       | Meaning                         |
| -------------------------- | ------------------------------- |
| `UNAUTHORIZED`             | Authentication required         |
| `FORBIDDEN`                | Insufficient permissions        |
| `VALIDATION_ERROR`         | Invalid input                   |
| `NOT_FOUND`                | Resource not found              |
| `CONFLICT`                 | Conflicting data                |
| `CONTRACT_NOT_FOUND`       | No applicable contract          |
| `CONTRACT_CONFLICT`        | Multiple applicable contracts   |
| `DUPLICATE_PAYSLIP`        | Payslip already exists          |
| `PAYROLL_INVALID`          | Payroll validation failed       |
| `INVALID_STATE_TRANSITION` | Workflow transition not allowed |

---

# API Design Principles

The API should:

* Validate all external input.
* Authorize every protected operation.
* Keep business rules server-side.
* Use transactions for critical workflows.
* Return predictable error structures.
* Avoid exposing sensitive employee/payroll information unnecessarily.
* Preserve historical payroll records.
