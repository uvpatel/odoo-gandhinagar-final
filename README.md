# PeoplePay360

> **Integrated HR & Payroll Operations Platform**

PeoplePay360 is a full-stack Human Resource and Payroll Operations platform designed to connect employee management, contracts, working schedules, attendance, time off, salary configuration, payroll processing, payslip generation, and reporting into one unified operational workflow.

Unlike basic HR systems that treat employee, attendance, leave, and payroll data as isolated records, PeoplePay360 connects these domains through business rules and period-aware relationships.

The platform transforms daily HR activity into accurate, explainable payroll results — from **Employee → Contract → Attendance & Time Off → Payrun → Payslip → Payment → Reporting**.

---

## ✨ Key Features

### 👥 Employee Management

* Employee Kanban, List, and Form views
* Centralized employee profile
* Department and manager assignment
* Job position and employee type
* Working schedule assignment
* Employment status tracking
* Related Contracts, Attendance, Time Off, and Allocation records
* Employee-centric operational hub

### 📄 Contract Management

* Historical employee contracts
* Contract start and end dates
* Wage and salary structure assignment
* Department and job position
* Active/inactive contract status
* Period-aware contract selection
* Protection against conflicting concurrent contracts

Payroll always resolves the contract applicable to the selected payroll period.

### 🕐 Working Schedules

* Weekly working patterns
* Day-wise start and end times
* Break duration
* Automatic weekly-hours calculation
* Employee/contract schedule assignment
* Attendance expectations based on assigned schedules

### 📊 Attendance

* Check-in and check-out tracking
* Automatic worked-hours calculation
* Attendance status
* Missing check-out detection
* Late/absent detection
* Overtime tracking
* Authorized manual corrections
* Attendance reporting
* Payroll dashboard integration

### 🏖️ Time Off

* Configurable Time Off Types
* Day/hour-based leave policies
* Allocation management
* Leave request workflow
* Approval/refusal workflow
* Leave balance tracking
* Validity periods
* Automatic allocation consumption
* Remaining/taken balance calculations

### 💰 Salary Structures

Salary Structures define reusable payroll calculation configurations.

Examples:

* Regular Salary
* Full-Time Employee
* Contract Employee
* Executive Salary

Each structure contains ordered Salary Rules that determine how a payslip is calculated.

### 🧮 Salary Rules

Salary Rules support configurable payroll components such as:

* Basic Salary
* Allowances
* Gross Salary
* Deductions
* Contributions
* Net Salary

Rules are processed according to sequence so that later calculations can depend on previously calculated components.

Supported calculation concepts include:

* Fixed amounts
* Percentages
* Formula-based calculations

### 🧾 Payroll

PeoplePay360 implements a controlled two-step Payrun workflow:

**Step 1 — Define Payroll Scope**

* Salary Structure
* Payroll Period

**Step 2 — Select Employees**

* Filter eligible employees
* Explicitly select payroll employees
* Create Payrun

After creation:

```text
Draft
  ↓
Compute
  ↓
Review Warnings
  ↓
Validate
  ↓
Mark Paid
  ↓
Send Payslips
```

### 🧾 Payslips

Each payslip contains:

* Employee
* Contract
* Salary Structure
* Payrun
* Payroll period
* Worked days
* Salary rule breakdown
* Basic salary
* Allowances
* Gross salary
* Deductions
* Contributions
* Net salary
* Validation status

### 📄 Payslip PDF

Employees can receive professionally formatted payslip PDFs containing their salary computation and payroll information.

### 📧 Bulk Payslip Delivery

Payroll users can send generated payslips to employees directly from a Payrun.

### 📈 Payroll Dashboard

The dashboard combines live information from:

* Employees
* Contracts
* Attendance
* Time Off
* Payroll
* Payslips

Example KPIs:

* Total Net Salary Paid
* Payslips Generated
* Average Salary
* Approved Time Off
* Attendance Health

Analytics include:

* Salary Cost by Department
* Monthly Net Salary Trends
* Department Headcount
* Attendance Overview
* Leave Overview
* Payroll Warnings

---

# 🔐 Role-Based Access Control

PeoplePay360 provides role-based permissions for different operational responsibilities.

| Role               | Access                                                |
| ------------------ | ----------------------------------------------------- |
| Employee           | Own profile, attendance, time off                     |
| HR Manager         | Employees, contracts, schedules, attendance, time off |
| HR Payroll User    | HR + Payruns/Payslips Create/Read/Update              |
| HR Payroll Manager | Full HR + Payroll configuration                       |
| Admin              | Complete system access                                |

### Permission Philosophy

Permissions are enforced at the application/business layer rather than relying only on UI visibility.

The system distinguishes between:

* Viewing records
* Creating records
* Updating records
* Deleting records
* Approving records
* Processing payroll
* Validating payroll
* Marking payroll as paid
* Managing system configuration

---

# 🔄 End-to-End Workflow

```text
Employee
   │
   ├── Department
   ├── Manager
   ├── Job Position
   └── Working Schedule
          │
          ▼
       Contract
          │
          ├── Wage
          ├── Salary Structure
          └── Employment Period
                    │
                    ▼
        ┌─────────────────────┐
        │ Daily HR Operations │
        └─────────────────────┘
             │           │
             ▼           ▼
        Attendance     Time Off
             │           │
             └─────┬─────┘
                   ▼
              Payroll Period
                   │
                   ▼
                Payrun
                   │
                   ▼
          Eligible Employees
                   │
                   ▼
              Payslips
                   │
                   ▼
          Salary Rule Engine
                   │
                   ▼
          Salary Computation
                   │
          ┌────────┴────────┐
          ▼                 ▼
       Warnings          Net Salary
          │                 │
          └────────┬────────┘
                   ▼
               Validate
                   │
                   ▼
               Mark Paid
                   │
          ┌────────┴────────┐
          ▼                 ▼
      PDF Payslip       Email Delivery
                   │
                   ▼
            Payroll Dashboard
```

---

# 🧠 Core Business Rules

PeoplePay360 focuses on business logic rather than simple CRUD.

### Period-Based Contract Resolution

For a payroll period, the system must select the contract applicable to that period.

```text
Payroll Period
      ↓
Find Employee Contracts
      ↓
Check Start/End Dates
      ↓
Find Applicable Contract
      ↓
Use Contract Wage + Salary Structure
```

Concurrent applicable contracts must be detected as a payroll warning/error.

### Salary Rule Sequencing

Salary rules execute in sequence.

Example:

```text
Basic Salary
      ↓
Housing Allowance
      ↓
Transport Allowance
      ↓
Gross Salary
      ↓
Tax Deduction
      ↓
Other Deduction
      ↓
Net Salary
```

### Leave Balance

```text
Allocated Leave
      -
Approved Leave
      =
Remaining Balance
```

### Attendance

```text
Check In
   +
Check Out
   -
Break
   =
Worked Hours
```

### Payroll Validation

Before payroll finalization, the system checks for issues such as:

* Missing employee information
* Missing bank/payment information
* Missing applicable contract
* Duplicate payslip
* Invalid contract period
* Missing salary structure
* Invalid salary rule configuration
* Attendance anomalies
* Other payroll warnings

---

# 🏗️ Architecture

PeoplePay360 follows a modular full-stack architecture.

```text
┌──────────────────────────────────────────┐
│                Frontend                  │
│ Next.js + React + shadcn/ui              │
└───────────────────┬──────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│           Application Layer              │
│ Server Actions / API / Validation        │
│ Authentication / Authorization           │
└───────────────────┬──────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│              Domain Layer                │
│ HR │ Attendance │ Time Off │ Payroll     │
│ Contracts │ Salary Rules │ Reporting      │
└───────────────────┬──────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│              Data Layer                  │
│ Drizzle ORM                              │
└───────────────────┬──────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│             PostgreSQL                   │
│                Neon                      │
└──────────────────────────────────────────┘
```

Detailed architecture is documented in:

`docs/ARCHITECTURE.md`

---

# 🛠️ Technology Stack

| Layer             | Technology                 |
| ----------------- | -------------------------- |
| Framework         | Next.js                    |
| UI                | React                      |
| Component System  | shadcn/ui                  |
| Styling           | Tailwind CSS               |
| Database          | PostgreSQL                 |
| Database Platform | Neon                       |
| ORM               | Drizzle ORM                |
| Authentication    | Better Auth                |
| Validation        | Zod                        |
| Server State      | TanStack Query             |
| Client State      | Zustand                    |
| Email             | Resend                     |
| PDF               | Server-side PDF generation |
| Language          | TypeScript                 |

---

# 🚀 Getting Started

## Prerequisites

Install:

* Node.js
* npm/pnpm
* PostgreSQL-compatible database
* Git

## Installation

```bash
git clone <repository-url>

cd PeoplePay360

npm install
```

## Environment Variables

Create:

```bash
.env.local
```

Example:

```env
DATABASE_URL=

BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

RESEND_API_KEY=
EMAIL_SENDER_ADDRESS=
```

Never commit `.env.local`.

Use `.env.example` as the configuration reference.

## Database

Generate migrations:

```bash
npx drizzle-kit generate
```

Apply migrations:

```bash
npx drizzle-kit migrate
```

For development:

```bash
npm run dev
```

Application:

```text
http://localhost:3000
```

---

# 🧪 Development Principles

PeoplePay360 follows these principles:

1. Business logic must be implemented server-side.
2. UI permissions must never be treated as security.
3. Payroll calculations must be deterministic and auditable.
4. Historical payroll records must remain immutable after finalization.
5. Database relationships should represent actual business relationships.
6. Configuration should drive payroll calculations instead of hardcoded salary values.
7. Validation should happen before payroll finalization.
8. Every important workflow should have clear states and transitions.

---

# 🧪 Testing

Recommended test areas:

* Authentication
* Role permissions
* Contract resolution
* Attendance calculations
* Leave balance calculations
* Salary rule calculations
* Payslip generation
* Duplicate payslip detection
* Payroll validation
* Payrun state transitions

Run tests:

```bash
npm test
```

---

# 🗺️ Roadmap

See:

`docs/ROADMAP.md`

---

# 📚 Documentation

| Document               | Description                              |
| ---------------------- | ---------------------------------------- |
| `docs/ARCHITECTURE.md` | System architecture and design decisions |
| `docs/API.md`          | API and application contracts            |
| `docs/ROADMAP.md`      | Planned improvements                     |
| `CONTRIBUTING.md`      | Contribution workflow                    |
| `SECURITY.md`          | Security reporting policy                |
| `CHANGELOG.md`         | Release history                          |


---

# 📌 Project Status

**Status:** Hackathon / Production-oriented MVP

PeoplePay360 is designed as a functional demonstration of an integrated HR and payroll workflow, with emphasis on data relationships, business rules, payroll computation, permissions, and operational UX.

---

# 📄 License

This project is distributed under the license specified in `LICENSE`.

---

## Built for the Odoo Hackathon

**PeoplePay360 — Connecting People, Time & Payroll.**
