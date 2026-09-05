# 🏆 PeoplePay360 — Hackathon Winning Production Video & Audio Script

**Project Name:** PeoplePay360 (Integrated Enterprise HRMS & Automated Payroll Operations Platform)  
**Target Video Duration:** 20 – 30 Minutes  
**Format:** Multi-Role Live Screen Capture, Voiceover Audio Script, On-Screen Directives, and RBAC Walkthrough  

---

## 🎭 Cast of Personas & RBAC Test Accounts

To deliver a production-grade demonstration, the video toggles between 4 key Role-Based Access Control (RBAC) personas:

| Persona | Role Name | System Role Key | Primary Responsibilities |
| :--- | :--- | :--- | :--- |
| **Alex Rivera** | System Administrator | `admin` | Platform setup, user provisioning, global RBAC, organization configuration. |
| **Sarah Jenkins** | Payroll Manager | `payroll_manager` | Salary structures, rules engine, payrun wizard execution, PDF generation, email dispatch. |
| **Marcus Vance** | HR Manager | `hr_manager` | Employee directory, contract lifecycle, leave approvals, attendance exception handling. |
| **David Miller** | Software Engineer | `employee` | Employee self-service, check-in/out widget, personal shift logs, payslip downloads. |

---

## 🎬 Master Timed Scene Directory

- **[00:00 - 02:30]** — **Act 1:** Vision, Problem Statement & Platform Intro
- **[02:30 - 05:00]** — **Act 2:** Technical Architecture, Security & RBAC Framework
- **[05:00 - 08:30]** — **Act 3:** System Administration, User Provisioning & Role Delegation (`admin`)
- **[08:30 - 12:30]** — **Act 4:** Employee Directory, Org Structure & Contract Lifecycle (`hr_manager`)
- **[12:30 - 16:30]** — **Act 5:** Attendance Tracking, Real-Time Widget & Time-Off Approvals (`employee` & `hr_manager`)
- **[16:30 - 20:30]** — **Act 6:** Salary Rules Engine & Dynamic Structure Builder (`payroll_manager`)
- **[20:30 - 25:30]** — **Act 7:** The End-to-End Monthly Payrun Processing Wizard (`payroll_manager`)
- **[25:30 - 28:00]** — **Act 8:** Automated Payslip PDF Engine, Resend Dispatch & Employee Self-Service (`employee`)
- **[28:00 - 30:00]** — **Act 9:** Executive Analytics, Cost Reports & Closing Pitch

---

# 📜 Step-by-Step Production Video Script

---

### ACT 1: Vision, Problem Statement & Platform Intro
**Duration:** `00:00 - 02:30`  
**Focus:** Highlighting real-world HR friction, compliance risks, and PeoplePay360's unified solution.

#### Scene 1.1: Title Card & Animated Intro
- **🎥 VISUAL:** High-energy motion graphic title card displaying **PeoplePay360: Next-Gen HRMS & Automated Payroll Operations Platform**. Camera transitions to the sleek dark-mode Landing Page/Login Screen with dynamic glassmorphism aesthetics.
- **🖥️ SCREEN:** `http://localhost:3000/login`
- **👤 ROLE:** Public / Unauthenticated
- **🎙️ AUDIO (VOICEOVER):**  
  > *"Welcome to the future of workforce management. In today's enterprise environment, human resources and payroll operations are severely broken. Organizations struggle with fragmented legacy software—using one system for attendance, another for employee contracts, static spreadsheets for salary rules, and error-prone manual calculations for monthly payroll.*  
  >  
  > *This fragmentation leads to payroll calculation errors, missed compliance deadlines, delayed payslip distribution, and frustrated employees. Enter **PeoplePay360**—a full-stack, enterprise-grade HRMS and automated payroll engine built from the ground up to unify the entire employee lifecycle into a single, high-performance platform."*

#### Scene 1.2: High-Level Dashboard Overview
- **🎥 VISUAL:** Smooth transition into the main executive dashboard after logging in as Administrator Alex Rivera. Quick panning shot showing metric KPI cards (Total Employees, Active Contracts, Monthly Payroll Expense, Attendance Ratio), interactive charts, and quick-action navigation sidebars.
- **🖥️ SCREEN:** `http://localhost:3000/dashboard`
- **👤 ROLE:** `admin`
- **🎙️ AUDIO (VOICEOVER):**  
  > *"PeoplePay360 eliminates manual friction completely. From dynamic contract management and real-time shift tracking to custom mathematical salary rule engines and automated PDF payslip generation with email distribution, PeoplePay360 delivers accuracy, speed, and strict security."*

---

### ACT 2: Technical Architecture, Security & RBAC Framework
**Duration:** `02:30 - 05:00`  
**Focus:** Deep dive into the tech stack, security layer, and granular RBAC.

#### Scene 2.1: Architectural Blueprint Visualization
- **🎥 VISUAL:** Clean graphic overlay showing the system architecture diagram. Highlights:
  - **Framework:** Next.js 16 (App Router) & React 19
  - **Type Safety:** TypeScript & Zod Schema Validation
  - **Database & ORM:** PostgreSQL (Neon Serverless) & Drizzle ORM
  - **Authentication & RBAC:** Better Auth with custom role statement policies
  - **Async Computations & Concurrency:** PostgreSQL Advisory Locks & Atomic Transactions
  - **Styling & UI:** Tailwind CSS v4, Shadcn UI, Motion, and Sonner notifications.
- **🖥️ SCREEN:** Architectural Slide / System Component Diagram
- **🎙️ AUDIO (VOICEOVER):**  
  > *"Under the hood, PeoplePay360 is built with modern web technologies for maximum performance and security. Powered by **Next.js 16 App Router** and **React 19**, we utilize **Drizzle ORM** connected to a serverless **Neon PostgreSQL** database.*  
  >  
  > *Security is paramount in financial operations. Our platform implements strict Role-Based Access Control using **Better Auth**, ensuring that sensitive payroll computations, wage information, and contract details are strictly scoped according to user roles."*

#### Scene 2.2: Granular RBAC Permissions Demonstration
- **🎥 VISUAL:** Split-screen or quick side-by-side comparison showing what an Employee sees vs. what an HR Manager or Payroll Manager sees. Note how administrative buttons (Create Payrun, Delete Employee, Edit Salary Rules) automatically adapt or hide based on the active role context.
- **🖥️ SCREEN:** `/attendance` (Employee View) vs. `/attendance` (HR Manager View)
- **🎙️ AUDIO (VOICEOVER):**  
  > *"Notice how the interface seamlessly enforces security. A standard employee accessing attendance can only view their own punch history, whereas an HR Manager or Payroll Administrator gets full access to manual corrections, exception handling, and company-wide reports. Let's walk through how these roles operate in real-time."*

---

### ACT 3: System Administration & User Provisioning
**Duration:** `05:00 - 08:30`  
**Focus:** Demonstrating system administration, role assignment, and user management.

#### Scene 3.1: Admin User Management Portal
- **🎥 VISUAL:** Logged in as **Alex Rivera (Admin)**. Click on **Administration** in the main sidebar, navigating to the **Users & Roles Management** page. Show the data table listing all platform users, their assigned roles, department tags, and status badges.
- **🖥️ SCREEN:** `http://localhost:3000/admin/users`
- **👤 ROLE:** `admin`
- **👇 ACTION:** Hover over user rows, click the **Edit Role** action button for a user.
- **🎙️ AUDIO (VOICEOVER):**  
  > *"We begin our journey in the Administration Console. As a System Administrator, Alex Rivera has complete control over user provisioning and role assignments. Here, we see every user registered in the organization.*  
  >  
  > *PeoplePay360 defines 5 standardized roles: **Admin**, **HR Manager**, **Payroll Manager**, **Payroll User**, and **Employee**. Each role grants precise, granular permissions across resources like contracts, attendance, salary structures, and financial reports."*

#### Scene 3.2: Dynamic Role Update & Real-Time Security Test
- **🎥 VISUAL:** Open the Role Assignment Modal for user **David Miller**. Change his role from `employee` to `payroll_manager`. Click **Save Changes**. Show toast notification *"User role updated successfully"*. Then switch back to demonstrate role immutability checks.
- **🖥️ SCREEN:** `http://localhost:3000/admin/users` (Modal Open)
- **👇 ACTION:** Select `Payroll Manager` from dropdown $\rightarrow$ Click `Save Changes`.
- **🎙️ AUDIO (VOICEOVER):**  
  > *"Role updates take effect immediately. When a user's role is updated, Better Auth and our server-side `requirePermission` utility evaluate session statements on every single API request, guaranteeing zero unauthorized data leakage or privilege escalation."*

---

### ACT 4: Employee Directory, Org Structure & Contract Lifecycle
**Duration:** `08:30 - 12:30`  
**Focus:** Demonstrating employee onboarding, department hierarchies, and wage contract management.

#### Scene 4.1: HR Manager Access & Employee Directory
- **🎥 VISUAL:** Switch view to **Marcus Vance (HR Manager)**. Navigate to **Employees $\rightarrow$ All Employees**. Show the responsive grid/table with employee search, department filters, status badges, and contact details.
- **🖥️ SCREEN:** `http://localhost:3000/employees`
- **👤 ROLE:** `hr_manager`
- **👇 ACTION:** Type "David" into the search bar. Filter by "Engineering Department".
- **🎙️ AUDIO (VOICEOVER):**  
  > *"Now let's step into the shoes of **Marcus Vance**, our HR Manager. Marcus oversees the workforce directory and contract lifecycles.*  
  >  
  > *The Employee Directory provides instant search and filtering by department, designation, or employment status. Every employee profile contains comprehensive details including employee numbers, work emails, phone numbers, department mappings, and designated bank accounts for direct deposit."*

#### Scene 4.2: Employee Onboarding & Profile Creation
- **🎥 VISUAL:** Click **"Add Employee"** button. A clean modal/form opens. Marcus fills out the onboarding form: First Name: *Sophia*, Last Name: *Chen*, Email: *sophia.chen@company.com*, Department: *Engineering*, Job Title: *Senior Full-Stack Engineer*, Bank Account: *123456789012*. Click **Save Employee**.
- **🖥️ SCREEN:** `http://localhost:3000/employees` (New Employee Modal)
- **👇 ACTION:** Submit form $\rightarrow$ Watch new employee card appear in real-time.
- **🎙️ AUDIO (VOICEOVER):**  
  > *"Adding a new team member is effortless. Marcus inputs the core profile data, work credentials, and banking details required for automated payroll payouts. Upon saving, the employee is immediately integrated into the company's organizational hierarchy."*

#### Scene 4.3: Contract Creation & Salary Structure Association
- **🎥 VISUAL:** Navigate to **Contracts** section (`/contracts`). Click **"New Contract"**. Select employee **Sophia Chen**. Set Contract Number: *CNT-2026-089*, Wage: *₹1,20,000 / month*, Start Date: *2026-01-01*, Structure: *Standard Corporate Structure (Full Package)*, Status: *Active*. Click **Save Contract**.
- **🖥️ SCREEN:** `http://localhost:3000/contracts`
- **👤 ROLE:** `hr_manager`
- **👇 ACTION:** Select Structure $\rightarrow$ Input Wage $\rightarrow$ Click `Save Contract`.
- **🎙️ AUDIO (VOICEOVER):**  
  > *"A critical requirement for automated payroll is an active wage contract. In the Contract Management module, Marcus binds Sophia's profile to a formal compensation contract.*  
  >  
  > *Notice that every contract links directly to a **Salary Structure**. This association dictates exactly which salary rules, tax brackets, allowances, and deductions will apply when the monthly payroll engine runs."*

---

### ACT 5: Attendance Tracking, Live Timer & Time-Off Approvals
**Duration:** `12:30 - 16:30`  
**Focus:** Showing real-time attendance check-in/out, live shift duration timer, exception resolution, and leave workflows.

#### Scene 5.1: Employee Self-Service Check-In & Live Shift Timer
- **🎥 VISUAL:** Switch persona to **David Miller (Employee)** on his personal attendance dashboard. Click on the **"Check In"** button on the Quick Action Widget. Watch the status indicator change from red (Checked Out) to a pulsing green (Checked In). Show the live duration timer counting up in real-time `00:00:01` $\rightarrow$ `00:00:05`.
- **🖥️ SCREEN:** `http://localhost:3000/attendance/me`
- **👤 ROLE:** `employee`
- **👇 ACTION:** Click `Check In` $\rightarrow$ Observe live timer `00:01:24` counting up.
- **🎙️ AUDIO (VOICEOVER):**  
  > *"Now let's switch to **David Miller**, a Software Engineer. Every morning, David logs into his Employee Portal and checks in for his shift using the Quick Attendance Widget.*  
  >  
  > *Upon clicking Check In, the system creates an active attendance session in PostgreSQL and starts a live duration timer. Even if David navigates across different pages or refreshes his browser, his session state remains active and perfectly synchronized with the server."*

#### Scene 5.2: Check-Out & Shift Duration Calculation
- **🎥 VISUAL:** Click **"Check Out"** button. The status changes back to checked out, and a toast appears: *"Checked out successfully! Total duration recorded."* Show the new row added to the Personal Attendance History table displaying Date, Check In time, Check Out time, Worked Hours (e.g. `8.00 hrs`), and Status badge (`Present`).
- **🖥️ SCREEN:** `http://localhost:3000/attendance/me`
- **👇 ACTION:** Click `Check Out` $\rightarrow$ Review table entry.
- **🎙️ AUDIO (VOICEOVER):**  
  > *"At the end of the workday, David clicks Check Out. PeoplePay360 automatically computes the exact worked minutes, checks against standard shift durations, handles overtime thresholds, and logs the shift record into the central database for payroll verification."*

#### Scene 5.3: Leave Requests & Manager Approval Workflow
- **🎥 VISUAL:** Switch to **Marcus Vance (HR Manager)**. Navigate to **Time Off Requests** (`/time-off`). View pending leave requests. Click **"Approve"** on an employee's paid vacation request. Show status badge instantly update to `Approved`.
- **🖥️ SCREEN:** `http://localhost:3000/time-off`
- **👤 ROLE:** `hr_manager`
- **👇 ACTION:** Click `Approve Request` $\rightarrow$ Show toast notification.
- **🎙️ AUDIO (VOICEOVER):**  
  > *"Attendance and leave are tightly integrated. When Marcus approves a paid leave request, the payroll engine automatically factors paid vs. unpaid days off during monthly salary calculations, eliminating manual adjustments."*

---

### ACT 6: Salary Rules Engine & Dynamic Structure Builder
**Duration:** `16:30 - 20:30`  
**Focus:** Demonstrating the custom mathematical rule engine and drag/order salary structure builder.

#### Scene 6.1: Salary Rules Management Portal
- **🎥 VISUAL:** Switch persona to **Sarah Jenkins (Payroll Manager)**. Navigate to **Payroll $\rightarrow$ Salary Rules** (`/payroll/salary-rules`). Show the list of configured salary rules: Basic Salary, House Rent Allowance (HRA), Dearness Allowance (DA), Special Allowance, Provident Fund (PF), Professional Tax (PT), and TDS.
- **🖥️ SCREEN:** `http://localhost:3000/payroll/salary-rules`
- **👤 ROLE:** `payroll_manager`
- **🎙️ AUDIO (VOICEOVER):**  
  > *"Now we enter the core engine of PeoplePay360 with **Sarah Jenkins**, our Payroll Manager. Salary calculation is governed by customizable **Salary Rules**.*  
  >  
  > *Our platform supports multiple computation types: Fixed Amounts, Percentage of Basic/Gross Wage, and Dynamic Mathematical Formulas. Let's look at how a rule is built."*

#### Scene 6.2: Rule Builder Modal (Formula & Percentage)
- **🎥 VISUAL:** Click **"Edit"** on **House Rent Allowance (HRA)**. Open the Rule Editor Modal. Show fields: Rule Name: *House Rent Allowance*, Code: *HRA*, Category: *Allowance*, Computation Type: *Percentage*, Percentage: *50%*, Base: *BASIC*. Click **Save Rule**.
- **🖥️ SCREEN:** `http://localhost:3000/payroll/salary-rules` (Rule Editor Modal)
- **👇 ACTION:** Show computation type selector $\rightarrow$ Select `Percentage of Basic`.
- **🎙️ AUDIO (VOICEOVER):**  
  > *"Rules can represent allowances or deductions. Here, HRA is calculated as 50% of the employee's Basic salary. Similarly, Provident Fund (PF) is set as a 12% deduction, and Professional Tax (PT) is calculated based on statutory slabs."*

#### Scene 6.3: Salary Structures Builder & Execution Sequence Reordering
- **🎥 VISUAL:** Navigate to **Payroll $\rightarrow$ Salary Structures** (`/payroll/salary-structures`). Click **"Edit"** on *Standard Corporate Structure (Full Package)*. Show the interactive modal dialog containing rule checkboxes and the **Execution Order List** with **Move Up** ($\uparrow$) and **Move Down** ($\downarrow$) sequence buttons.
- **🖥️ SCREEN:** `http://localhost:3000/payroll/salary-structures` (Structure Editor Modal)
- **👇 ACTION:** Check additional rule $\rightarrow$ Click `Move Up` button to shift PF before TDS. Click `Save Changes`.
- **🎙️ AUDIO (VOICEOVER):**  
  > *"Salary Rules are grouped into **Salary Structures**. Because certain calculations depend on prior results—such as calculating Gross Pay before computing Tax Deductions—the order of execution is critical.*  
  >  
  > *In the Salary Structure Builder, Sarah can check which rules to include and reorder their execution sequence using intuitive controls. PeoplePay360 guarantees that rules execute in strict sequence order during payroll computation."*

---

### ACT 7: The End-to-End Monthly Payrun Processing Wizard
**Duration:** `20:30 - 25:30`  
**Focus:** Step-by-step walkthrough of the 2-step payrun creation wizard, employee evaluation, computation engine with advisory locking, and validation.

#### Scene 7.1: Step 1 — Scope & Period Definition
- **🎥 VISUAL:** Navigate to **Payroll $\rightarrow$ Payruns** (`/payroll/payruns`). Click **"Create Payrun"** button. The 2-Step Payrun Wizard opens.
  - Payrun Name: *Monthly Payrun — August 2026*
  - Salary Structure: *Standard Corporate Structure (Full Package)*
  - Period Start: *2026-08-01*
  - Period End: *2026-08-31*
  Click **"Next: Select Employees"**.
- **🖥️ SCREEN:** `http://localhost:3000/payroll/payruns/new` (Wizard Step 1)
- **👤 ROLE:** `payroll_manager`
- **👇 ACTION:** Fill period dates $\rightarrow$ Select Structure $\rightarrow$ Click `Next: Select Employees`.
- **🎙️ AUDIO (VOICEOVER):**  
  > *"Now for the centerpiece of our platform: **The Payrun Wizard**. Processing payroll for hundreds of employees takes just two simple steps.*  
  >  
  > *In Step 1, Sarah names the payrun, selects the date range for the payroll cycle, and designates the target Salary Structure."*

#### Scene 7.2: Step 2 — Real-Time Employee Eligibility Evaluation
- **🎥 VISUAL:** Wizard transitions to Step 2 ("Select Eligible Employees"). Show the system automatically calling `/api/payroll/payruns/eligible-employees` and rendering the evaluated employee table.
  - Table Columns: Employee Checkbox, Name/Email, Department/Role, Active Contract & Wage, Bank Account Status, Eligibility Badge (`Eligible`, `Warning`, `Ineligible`).
  - Point out eligibility badges: Green `Eligible` badge for complete contracts; Amber `Warning` badge for missing bank accounts.
- **🖥️ SCREEN:** `http://localhost:3000/payroll/payruns/new` (Wizard Step 2)
- **👇 ACTION:** Filter by Department $\rightarrow$ Click `Select All Eligible` $\rightarrow$ Click `Create Payrun (8)`.
- **🎙️ AUDIO (VOICEOVER):**  
  > *"In Step 2, PeoplePay360 performs an automated pre-flight audit. The system evaluates every active employee contract in the company for the selected period, verifying contract dates, active statuses, and banking credentials.*  
  >  
  > *Employees with complete records are flagged as **Eligible**. Sarah clicks 'Select All Eligible' and triggers 'Create Payrun'."*

#### Scene 7.3: Payrun Detail View & Automated Computation Engine
- **🎥 VISUAL:** System creates draft payrun and redirects to `/payroll/payruns/[payrunId]`. The Payrun Detail Header displays Status: `Draft`, Total Payslips: `8`, Gross: `₹0.00`, Net: `₹0.00`. Click the prominent **"Compute Payrun"** button. Show animated loading spinner with text *"Executing salary engine across active contracts and attendance logs..."*.
- **🖥️ SCREEN:** `http://localhost:3000/payroll/payruns/[payrunId]`
- **👇 ACTION:** Click `Compute Payrun` $\rightarrow$ Watch values calculate in real-time.
- **🎙️ AUDIO (VOICEOVER):**  
  > *"With the draft payrun created, Sarah clicks **Compute Payrun**. Behind the scenes, PeoplePay360 executes a transactional calculation engine powered by PostgreSQL advisory locks (`pg_advisory_xact_lock`) to prevent race conditions.*  
  >  
  > *For every selected employee, the engine aggregates actual attendance records, calculates worked hours, evaluates approved leaves, runs every salary rule in sequence, and generates itemized payslip lines."*

#### Scene 7.4: Computed Financial Totals & Validation Gate
- **🎥 VISUAL:** Computation completes! Status updates to `Computed`. Total Gross updates to `₹8,45,000.00`, Deductions to `₹1,12,400.00`, Net Total to `₹7,32,600.00`. Expand an itemized employee payslip drawer showing line items (Basic, HRA, DA, PF, PT, Net Pay). Then click **"Validate Payrun"**.
- **🖥️ SCREEN:** `http://localhost:3000/payroll/payruns/[payrunId]`
- **👇 ACTION:** Click `Validate Payrun` $\rightarrow$ Status changes to `Validated` (emerald badge).
- **🎙️ AUDIO (VOICEOVER):**  
  > *"In seconds, the entire payroll is computed! Sarah can inspect itemized earnings and deductions for every single employee.*  
  >  
  > *Before final approval, Sarah clicks **Validate Payrun**. The validation engine runs a final audit for blocking errors. Once validated, the payrun status updates to **Validated**, locking the figures against further editing."*

---

### ACT 8: Automated Payslip PDF Engine, Resend Email Dispatch & Employee Self-Service
**Duration:** `25:30 - 28:00`  
**Focus:** Demonstrating programmatic PDF generation, bulk email delivery, and employee payslip access.

#### Scene 8.1: Bulk Payslip Email Dispatch via Resend
- **🎥 VISUAL:** In the Validated Payrun Detail View, Sarah clicks **"Send Payslips"**. A toast notification appears: *"Dispatching itemized payslips via Resend API..."*. Shortly after, a success toast pops up: *"8 sent · 0 failed. All employee payslip emails dispatched successfully!"*.
- **🖥️ SCREEN:** `http://localhost:3000/payroll/payruns/[payrunId]`
- **👤 ROLE:** `payroll_manager`
- **👇 ACTION:** Click `Send Payslips` $\rightarrow$ Show success toast.
- **🎙️ AUDIO (VOICEOVER):**  
  > *"With a single click on **Send Payslips**, PeoplePay360 triggers our automated document generation engine. Using `pdf-lib`, the system programmatically builds itemized PDF payslips in memory and dispatches them directly to employees' inboxes via the **Resend API**."*

#### Scene 8.2: Employee Receives Email & Downloads PDF
- **🎥 VISUAL:** Switch persona to **David Miller (Employee)**. Open email client / browser inbox. Show the incoming email:  
  **Subject:** *Your Payslip for Monthly Payrun — August 2026 (PSL-2026-004)*  
  Open the email showing formatted HTML table with Gross Pay, Deductions, Net Pay, and the attached PDF document `payslip-PSL-2026-004.pdf`. Click and preview the professional PDF payslip.
- **🖥️ SCREEN:** Email Inbox & PDF Preview Viewer
- **👤 ROLE:** `employee`
- **👇 ACTION:** Open Email $\rightarrow$ Open PDF attachment $\rightarrow$ Zoom in on itemized salary breakdown.
- **🎙️ AUDIO (VOICEOVER):**  
  > *"David receives an instant email notification containing a summary of his earnings and an attached, publication-ready PDF payslip. The PDF features company branding, statutory breakdown, worked hours summary, and net payout totals."*

#### Scene 8.3: Employee Portal Payslip Download
- **🎥 VISUAL:** Return to David's Employee Portal (`/payroll/payslips`). David views his personal payslip history list and clicks **"Print / Download PDF"**.
- **🖥️ SCREEN:** `http://localhost:3000/payroll/payslips`
- **👇 ACTION:** Click `Download PDF` button.
- **🎙️ AUDIO (VOICEOVER):**  
  > *"Employees can also access, view, or download their historic payslips anytime through their self-service portal, reducing routine HR inquiries to zero."*

---

### ACT 9: Executive Analytics, Cost Reports & Closing Pitch
**Duration:** `28:00 - 30:00`  
**Focus:** Executive reporting dashboards, platform recap, and competition winning closing remarks.

#### Scene 9.1: Executive Payroll Analytics & Department Cost Reports
- **🎥 VISUAL:** Switch persona back to **Alex Rivera (Admin)**. Navigate to **Reports $\rightarrow$ Payroll & Department Costs** (`/reports`). Show interactive charts:
  - Department Payroll Cost Distribution (Pie/Bar Chart)
  - Monthly Salary Expense Trends (Line Chart)
  - Attendance vs. Overtime Breakdown.
- **🖥️ SCREEN:** `http://localhost:3000/reports`
- **👤 ROLE:** `admin`
- **👇 ACTION:** Hover over Recharts interactive tooltips showing department cost breakdowns.
- **🎙️ AUDIO (VOICEOVER):**  
  > *"Finally, leadership gains complete financial visibility through Executive Analytics. Interactive department cost reports, monthly payroll trend lines, and attendance correlation charts empower management to make data-driven workforce decisions."*

#### Scene 9.2: Summary & Hackathon Winning Closing Pitch
- **🎥 VISUAL:** Camera pans out to a montage of key screens: 
  1. The Attendance Widget pulsing live
  2. The Salary Rule Builder
  3. The 2-Step Payrun Processing Wizard
  4. The PDF Payslip Document
  Display final slide: **PeoplePay360 — Transform Your Workforce Operations Today**.
- **🖥️ SCREEN:** Project Feature Showcase Montage
- **🎙️ AUDIO (VOICEOVER):**  
  > *"To summarize: **PeoplePay360** transforms enterprise workforce management by combining:  
  >  
  >  1. **Strict Role-Based Security** powered by Better Auth  
  >  2. **Flexible Salary & Mathematical Rule Engines**  
  >  3. **Transactional, Race-Condition-Proof Payroll Processing** with PostgreSQL advisory locking  
  >  4. **Automated PDF Generation & Email Delivery** via Resend  
  >  5. **Seamless Employee Self-Service & Executive Analytics**  
  >  
  > *Built with Next.js 16, React 19, Drizzle ORM, and Tailwind CSS, PeoplePay360 delivers an unmatched, production-ready solution for modern enterprises.*  
  >  
  > *Thank you for watching, and welcome to PeoplePay360!"*

---

# 📌 Technical Recording Directives & Tips for Video Creator

1. **Resolution & Aspect Ratio:** Record in `1920x1080` (1080p) or `3840x2160` (4K) at 60 FPS.
2. **Audio Sync:** Use a clear condenser microphone or AI voiceover (e.g., ElevenLabs / Deepgram) synced to timestamps.
3. **Cursor & Highlights:** Enable smooth mouse cursor highlighting/click ripple effects during UI actions.
4. **Browser State:** Keep Chrome/Firefox zoomed at 100% or 110% for crisp readability of dark-mode UI text.
