import "dotenv/config";
import { sql, db } from "@/db/index";
import {
  users,
  accounts,
  departments,
  jobPositions,
  workingSchedules,
  workingScheduleLines,
  employees,
  employeeHistory,
  contracts,
  attendance,
  attendanceCorrections,
  timeOffTypes,
  timeOffAllocations,
  timeOffRequests,
  salaryStructures,
  salaryRules,
  salaryStructureRules,
  payruns,
  payslips,
  payslipLines,
  payslipWarnings,
} from "@/db/schema";
import { hashPassword } from "better-auth/crypto";
import { executeSalaryEngine } from "@/server/services/payroll/salary-engine";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Starting Neon Database Seeding for PeoplePay360...\n");

  // ============================================================================
  // 1. CLEAN EXISTING OPERATIONAL DATA (Safe reverse dependency order)
  // Preserve existing users, but clear child tables for idempotent, clean seeding
  // ============================================================================
  console.log("🧹 Clearing previous operational records...");
  await db.delete(payslipWarnings);
  await db.delete(payslipLines);
  await db.delete(payslips);
  await db.delete(payruns);
  await db.delete(salaryStructureRules);
  await db.delete(salaryRules);
  await db.delete(salaryStructures);
  await db.delete(timeOffRequests);
  await db.delete(timeOffAllocations);
  await db.delete(timeOffTypes);
  await db.delete(attendanceCorrections);
  await db.delete(attendance);
  await db.delete(contracts);
  await db.delete(employeeHistory);
  await db.delete(employees);
  await db.delete(workingScheduleLines);
  await db.delete(workingSchedules);
  await db.delete(jobPositions);
  await db.delete(departments);
  console.log("✓ Operational tables cleared successfully.\n");

  // ============================================================================
  // 2. WORKING SCHEDULES & SCHEDULE LINES
  // ============================================================================
  console.log("⏱️  Seeding Working Schedules...");
  const [standardSchedule] = await db
    .insert(workingSchedules)
    .values({
      name: "Standard 40h Workweek (Mon-Fri 9AM-6PM)",
      scheduleType: "standard",
      timezone: "Asia/Kolkata",
      isActive: true,
    })
    .returning();

  const [flexSchedule] = await db
    .insert(workingSchedules)
    .values({
      name: "Flexible Shift (Mon-Fri 10AM-7PM)",
      scheduleType: "shift",
      timezone: "Asia/Kolkata",
      isActive: true,
    })
    .returning();

  // Mon-Fri lines for standard schedule (day 1 to 5)
  const standardScheduleLines = [1, 2, 3, 4, 5].map((day) => ({
    scheduleId: standardSchedule.id,
    dayOfWeek: day,
    startTime: "09:00:00",
    endTime: "18:00:00",
    breakMinutes: 60,
  }));

  const flexScheduleLines = [1, 2, 3, 4, 5].map((day) => ({
    scheduleId: flexSchedule.id,
    dayOfWeek: day,
    startTime: "10:00:00",
    endTime: "19:00:00",
    breakMinutes: 60,
  }));

  await db.insert(workingScheduleLines).values([...standardScheduleLines, ...flexScheduleLines]);
  console.log("✓ Working schedules created.\n");

  // ============================================================================
  // 3. DEPARTMENTS
  // ============================================================================
  console.log("🏢 Seeding Departments...");
  const deptData = [
    {
      name: "Executive Leadership",
      code: "EXEC",
      description: "Company strategic vision, executive oversight, and governance.",
    },
    {
      name: "Human Resources",
      code: "HR",
      description: "People operations, talent acquisition, culture, and employee welfare.",
    },
    {
      name: "Finance & Payroll",
      code: "FIN",
      description: "Financial planning, accounting, compliance, and payroll operations.",
    },
    {
      name: "Engineering & Architecture",
      code: "ENG",
      description: "Core software engineering, cloud infrastructure, and DevOps.",
    },
    {
      name: "Product & UI/UX Design",
      code: "PROD",
      description: "Product roadmap, user experience research, and interface design.",
    },
    {
      name: "Sales & Customer Success",
      code: "SALES",
      description: "Enterprise sales, client relations, and continuous support.",
    },
  ];

  const depts = await db.insert(departments).values(deptData).returning();
  const deptMap = new Map(depts.map((d) => [d.code, d]));
  console.log(`✓ Seeded ${depts.length} departments.\n`);

  // ============================================================================
  // 4. JOB POSITIONS
  // ============================================================================
  console.log("💼 Seeding Job Positions...");
  const jobData = [
    { title: "Chief Executive Officer", code: "CEO", description: "Overall business direction and executive leadership" },
    { title: "Chief Technology Officer", code: "CTO", description: "Technical vision, cloud infrastructure, and engineering oversight" },
    { title: "HR Director", code: "HRD", description: "Head of Human Resources and organizational development" },
    { title: "People Operations Specialist", code: "HR-SPEC", description: "Employee relations, onboarding, and benefits administration" },
    { title: "Finance & Payroll Manager", code: "PAY-MGR", description: "Manages salary computations, compliance, and tax withholding" },
    { title: "Payroll Officer", code: "PAY-OFFICER", description: "Executes monthly payruns, employee allowances, and deductions" },
    { title: "Lead Systems Architect", code: "ENG-ARCH", description: "System design, distributed architecture, and technical standards" },
    { title: "Senior Fullstack Engineer", code: "ENG-SR", description: "End-to-end fullstack development, Next.js, and API architecture" },
    { title: "Backend Engineer", code: "ENG-BE", description: "Database optimization, microservices, and background tasks" },
    { title: "Frontend Specialist", code: "ENG-FE", description: "Interactive user interfaces, design systems, and web performance" },
    { title: "QA Automation Engineer", code: "ENG-QA", description: "Automated testing, CI/CD integration, and quality assurance" },
    { title: "Senior Product Manager", code: "PROD-MGR", description: "Product strategy, user requirement analysis, and delivery" },
    { title: "Lead Product Designer", code: "PROD-DES", description: "Design systems, UI components, and user experience flows" },
  ];

  const jobs = await db.insert(jobPositions).values(jobData).returning();
  const jobMap = new Map(jobs.map((j) => [j.code, j]));
  console.log(`✓ Seeded ${jobs.length} job positions.\n`);

  // ============================================================================
  // 5. USERS & ACCOUNTS (Preserve existing, upsert test role accounts)
  // ============================================================================
  console.log("👤 Seeding Users & Authentication Accounts...");
  const defaultPassword = "Password123!";
  const hashedPassword = await hashPassword(defaultPassword);

  const seedUsers = [
    {
      id: "usr_admin_001",
      name: "Admin User",
      email: "admin@peoplepay360.com",
      role: "admin" as const,
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
    {
      id: "usr_hrm_001",
      name: "Sarah Jenkins",
      email: "hr.manager@peoplepay360.com",
      role: "hr_manager" as const,
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    },
    {
      id: "usr_paymgr_001",
      name: "Michael Chang",
      email: "payroll.manager@peoplepay360.com",
      role: "hr_payroll_manager" as const,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
    {
      id: "usr_payusr_001",
      name: "Priya Sharma",
      email: "payroll.officer@peoplepay360.com",
      role: "hr_payroll_user" as const,
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    },
    {
      id: "usr_emp_alex",
      name: "Alex Morgan",
      email: "alex.morgan@peoplepay360.com",
      role: "employee" as const,
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    },
    {
      id: "usr_emp_elena",
      name: "Elena Rostova",
      email: "elena.rostova@peoplepay360.com",
      role: "employee" as const,
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    },
    {
      id: "usr_emp_dev",
      name: "Dev Sharma",
      email: "dev.sharma@peoplepay360.com",
      role: "employee" as const,
      image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    },
    {
      id: "usr_emp_marcus",
      name: "Marcus Vance",
      email: "marcus.vance@peoplepay360.com",
      role: "employee" as const,
      image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    },
    {
      id: "usr_emp_sophia",
      name: "Sophia Taylor",
      email: "sophia.taylor@peoplepay360.com",
      role: "employee" as const,
      image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    },
  ];

  const userRecordMap = new Map<string, string>(); // email -> userId

  for (const u of seedUsers) {
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, u.email))
      .limit(1);

    let currentUserId = u.id;
    if (existingUser) {
      currentUserId = existingUser.id;
      await db
        .update(users)
        .set({
          name: u.name,
          role: u.role,
          image: u.image,
          emailVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id));
    } else {
      const [inserted] = await db
        .insert(users)
        .values({
          id: u.id,
          name: u.name,
          email: u.email,
          emailVerified: true,
          role: u.role,
          image: u.image,
        })
        .returning();
      currentUserId = inserted.id;
    }

    userRecordMap.set(u.email, currentUserId);

    // Ensure credential account exists for email/password login
    const [existingAcc] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, currentUserId))
      .limit(1);

    if (!existingAcc) {
      await db.insert(accounts).values({
        id: `acc_${currentUserId}`,
        accountId: currentUserId,
        providerId: "credential",
        userId: currentUserId,
        password: hashedPassword,
        issuer: "local:account:credential",
      });
    } else if (!existingAcc.password) {
      await db
        .update(accounts)
        .set({ password: hashedPassword })
        .where(eq(accounts.id, existingAcc.id));
    }
  }

  // Also check existing database users and ensure map has them
  const existingDbUsers = await db.select().from(users);
  for (const u of existingDbUsers) {
    userRecordMap.set(u.email, u.id);
  }

  console.log(`✓ User accounts verified (Password: "${defaultPassword}").\n`);

  // ============================================================================
  // 6. EMPLOYEES
  // ============================================================================
  console.log("🧑‍💼 Seeding Employees...");

  // Primary Executives & Managers
  const [ceoEmployee] = await db
    .insert(employees)
    .values({
      employeeNumber: "EMP-0001",
      userId: userRecordMap.get("uvpatel7271@gmail.com") || userRecordMap.get("admin@peoplepay360.com")!,
      firstName: "Urvil",
      lastName: "Patel",
      workEmail: "urvil@peoplepay360.com",
      phone: "+91 98765 43210",
      departmentId: deptMap.get("EXEC")!.id,
      jobPositionId: jobMap.get("CEO")!.id,
      workingScheduleId: standardSchedule.id,
      employeeType: "full_time",
      status: "active",
      joiningDate: "2023-01-01",
      bankName: "HDFC Bank",
      bankAccountNumber: "50100234567890",
    })
    .returning();

  const [hrManagerEmployee] = await db
    .insert(employees)
    .values({
      employeeNumber: "EMP-0002",
      userId: userRecordMap.get("hr.manager@peoplepay360.com")!,
      firstName: "Sarah",
      lastName: "Jenkins",
      workEmail: "hr.manager@peoplepay360.com",
      phone: "+91 98765 43211",
      departmentId: deptMap.get("HR")!.id,
      jobPositionId: jobMap.get("HRD")!.id,
      managerId: ceoEmployee.id,
      workingScheduleId: standardSchedule.id,
      employeeType: "full_time",
      status: "active",
      joiningDate: "2023-03-15",
      bankName: "State Bank of India",
      bankAccountNumber: "20100987654321",
    })
    .returning();

  const [payrollManagerEmployee] = await db
    .insert(employees)
    .values({
      employeeNumber: "EMP-0003",
      userId: userRecordMap.get("payroll.manager@peoplepay360.com")!,
      firstName: "Michael",
      lastName: "Chang",
      workEmail: "payroll.manager@peoplepay360.com",
      phone: "+91 98765 43212",
      departmentId: deptMap.get("FIN")!.id,
      jobPositionId: jobMap.get("PAY-MGR")!.id,
      managerId: ceoEmployee.id,
      workingScheduleId: standardSchedule.id,
      employeeType: "full_time",
      status: "active",
      joiningDate: "2023-05-01",
      bankName: "ICICI Bank",
      bankAccountNumber: "001205012345",
    })
    .returning();

  const [payrollOfficerEmployee] = await db
    .insert(employees)
    .values({
      employeeNumber: "EMP-0004",
      userId: userRecordMap.get("payroll.officer@peoplepay360.com")!,
      firstName: "Priya",
      lastName: "Sharma",
      workEmail: "payroll.officer@peoplepay360.com",
      phone: "+91 98765 43213",
      departmentId: deptMap.get("FIN")!.id,
      jobPositionId: jobMap.get("PAY-OFFICER")!.id,
      managerId: payrollManagerEmployee.id,
      workingScheduleId: standardSchedule.id,
      employeeType: "full_time",
      status: "active",
      joiningDate: "2023-08-01",
      bankName: "Axis Bank",
      bankAccountNumber: "91201002345678",
    })
    .returning();

  // Engineering & Product Team
  const [architectEmployee] = await db
    .insert(employees)
    .values({
      employeeNumber: "EMP-0005",
      userId: userRecordMap.get("marcus.vance@peoplepay360.com")!,
      firstName: "Marcus",
      lastName: "Vance",
      workEmail: "marcus.vance@peoplepay360.com",
      phone: "+91 98765 43214",
      departmentId: deptMap.get("ENG")!.id,
      jobPositionId: jobMap.get("ENG-ARCH")!.id,
      managerId: ceoEmployee.id,
      workingScheduleId: standardSchedule.id,
      employeeType: "full_time",
      status: "active",
      joiningDate: "2023-04-10",
      bankName: "HDFC Bank",
      bankAccountNumber: "50100345678901",
    })
    .returning();

  const [srEngineerEmployee] = await db
    .insert(employees)
    .values({
      employeeNumber: "EMP-0006",
      userId: userRecordMap.get("alex.morgan@peoplepay360.com")!,
      firstName: "Alex",
      lastName: "Morgan",
      workEmail: "alex.morgan@peoplepay360.com",
      phone: "+91 98765 43215",
      departmentId: deptMap.get("ENG")!.id,
      jobPositionId: jobMap.get("ENG-SR")!.id,
      managerId: architectEmployee.id,
      workingScheduleId: standardSchedule.id,
      employeeType: "full_time",
      status: "active",
      joiningDate: "2023-09-01",
      bankName: "Kotak Mahindra Bank",
      bankAccountNumber: "4512345678",
    })
    .returning();

  const [backendEmployee] = await db
    .insert(employees)
    .values({
      employeeNumber: "EMP-0007",
      userId: userRecordMap.get("dev.sharma@peoplepay360.com")!,
      firstName: "Dev",
      lastName: "Sharma",
      workEmail: "dev.sharma@peoplepay360.com",
      phone: "+91 98765 43216",
      departmentId: deptMap.get("ENG")!.id,
      jobPositionId: jobMap.get("ENG-BE")!.id,
      managerId: architectEmployee.id,
      workingScheduleId: standardSchedule.id,
      employeeType: "full_time",
      status: "active",
      joiningDate: "2024-01-15",
      bankName: "State Bank of India",
      bankAccountNumber: "30200876543210",
    })
    .returning();

  const [designerEmployee] = await db
    .insert(employees)
    .values({
      employeeNumber: "EMP-0008",
      userId: userRecordMap.get("elena.rostova@peoplepay360.com")!,
      firstName: "Elena",
      lastName: "Rostova",
      workEmail: "elena.rostova@peoplepay360.com",
      phone: "+91 98765 43217",
      departmentId: deptMap.get("PROD")!.id,
      jobPositionId: jobMap.get("PROD-DES")!.id,
      managerId: ceoEmployee.id,
      workingScheduleId: flexSchedule.id,
      employeeType: "full_time",
      status: "active",
      joiningDate: "2023-07-20",
      bankName: "HDFC Bank",
      bankAccountNumber: "50100456789012",
    })
    .returning();

  const [qaEmployee] = await db
    .insert(employees)
    .values({
      employeeNumber: "EMP-0009",
      userId: userRecordMap.get("sophia.taylor@peoplepay360.com")!,
      firstName: "Sophia",
      lastName: "Taylor",
      workEmail: "sophia.taylor@peoplepay360.com",
      phone: "+91 98765 43218",
      departmentId: deptMap.get("ENG")!.id,
      jobPositionId: jobMap.get("ENG-QA")!.id,
      managerId: architectEmployee.id,
      workingScheduleId: standardSchedule.id,
      employeeType: "full_time",
      status: "active",
      joiningDate: "2024-02-01",
      bankName: "ICICI Bank",
      bankAccountNumber: "001206023456",
    })
    .returning();

  // Link Darshan Ajudiya if present in DB
  const darshanUserId = userRecordMap.get("24cp020@bvmengineering.ac.in");
  let darshanEmployee = null;
  if (darshanUserId) {
    const [insertedDarshan] = await db
      .insert(employees)
      .values({
        employeeNumber: "EMP-0010",
        userId: darshanUserId,
        firstName: "Darshan",
        lastName: "Ajudiya",
        workEmail: "24cp020@bvmengineering.ac.in",
        phone: "+91 98765 43219",
        departmentId: deptMap.get("ENG")!.id,
        jobPositionId: jobMap.get("ENG-FE")!.id,
        managerId: architectEmployee.id,
        workingScheduleId: standardSchedule.id,
        employeeType: "full_time",
        status: "active",
        joiningDate: "2024-03-01",
        bankName: "Bank of Baroda",
        bankAccountNumber: "01450100012345",
      })
      .returning();
    darshanEmployee = insertedDarshan;
  }

  const allEmployees = [
    ceoEmployee,
    hrManagerEmployee,
    payrollManagerEmployee,
    payrollOfficerEmployee,
    architectEmployee,
    srEngineerEmployee,
    backendEmployee,
    designerEmployee,
    qaEmployee,
    ...(darshanEmployee ? [darshanEmployee] : []),
  ];

  console.log(`✓ Seeded ${allEmployees.length} employees.\n`);

  // ============================================================================
  // 7. EMPLOYEE CAREER HISTORY
  // ============================================================================
  console.log("📜 Seeding Career Progression History...");
  await db.insert(employeeHistory).values([
    {
      employeeId: srEngineerEmployee.id,
      eventType: "promotion",
      effectiveDate: "2025-01-01",
      previousDepartmentId: deptMap.get("ENG")!.id,
      newDepartmentId: deptMap.get("ENG")!.id,
      previousJobPositionId: jobMap.get("ENG-BE")!.id,
      newJobPositionId: jobMap.get("ENG-SR")!.id,
      notes: "Promoted to Senior Fullstack Engineer following outstanding leadership on platform architecture.",
    },
    {
      employeeId: payrollOfficerEmployee.id,
      eventType: "hiring",
      effectiveDate: "2023-08-01",
      newDepartmentId: deptMap.get("FIN")!.id,
      newJobPositionId: jobMap.get("PAY-OFFICER")!.id,
      notes: "Onboarded as Payroll Officer with extensive statutory compliance experience.",
    },
    {
      employeeId: architectEmployee.id,
      eventType: "promotion",
      effectiveDate: "2024-06-01",
      previousDepartmentId: deptMap.get("ENG")!.id,
      newDepartmentId: deptMap.get("ENG")!.id,
      previousJobPositionId: jobMap.get("ENG-SR")!.id,
      newJobPositionId: jobMap.get("ENG-ARCH")!.id,
      notes: "Promoted to Lead Systems Architect to head cross-functional infrastructure.",
    },
  ]);
  console.log("✓ Career history logged.\n");

  // ============================================================================
  // 8. SALARY RULES & STRUCTURES
  // ============================================================================
  console.log("💰 Seeding Salary Rules & Structures...");

  const rulesData = [
    {
      name: "Basic Salary",
      code: "BASIC",
      category: "basic" as const,
      computationType: "fixed" as const,
      sequence: 10,
      isActive: true,
    },
    {
      name: "House Rent Allowance",
      code: "HRA",
      category: "allowance" as const,
      computationType: "percentage" as const,
      percentage: "50.0000",
      percentageBase: "BASIC",
      sequence: 20,
      isActive: true,
    },
    {
      name: "Dearness Allowance",
      code: "DA",
      category: "allowance" as const,
      computationType: "percentage" as const,
      percentage: "10.0000",
      percentageBase: "BASIC",
      sequence: 30,
      isActive: true,
    },
    {
      name: "Special Allowance",
      code: "SPECIAL",
      category: "allowance" as const,
      computationType: "fixed" as const,
      fixedAmount: "5000.00",
      sequence: 40,
      isActive: true,
    },
    {
      name: "Gross Salary",
      code: "GROSS",
      category: "gross" as const,
      computationType: "formula" as const,
      formula: "BASIC + HRA + DA + SPECIAL",
      sequence: 100,
      isActive: true,
    },
    {
      name: "Provident Fund (Employee)",
      code: "PF",
      category: "deduction" as const,
      computationType: "percentage" as const,
      percentage: "12.0000",
      percentageBase: "BASIC",
      sequence: 120,
      isActive: true,
    },
    {
      name: "Professional Tax",
      code: "PT",
      category: "deduction" as const,
      computationType: "fixed" as const,
      fixedAmount: "200.00",
      sequence: 130,
      isActive: true,
    },
    {
      name: "Tax Deducted at Source (TDS)",
      code: "TDS",
      category: "deduction" as const,
      computationType: "percentage" as const,
      percentage: "5.0000",
      percentageBase: "GROSS",
      sequence: 140,
      isActive: true,
    },
    {
      name: "Total Deductions",
      code: "DEDUCTIONS",
      category: "deduction" as const,
      computationType: "formula" as const,
      formula: "PF + PT + TDS",
      sequence: 190,
      isActive: true,
    },
    {
      name: "Net Salary",
      code: "NET",
      category: "net" as const,
      computationType: "formula" as const,
      formula: "GROSS - DEDUCTIONS",
      sequence: 200,
      isActive: true,
    },
  ];

  const createdRules = await db.insert(salaryRules).values(rulesData).returning();
  const ruleMap = new Map(createdRules.map((r) => [r.code, r]));

  // Standard Salary Structure
  const [standardStructure] = await db
    .insert(salaryStructures)
    .values({
      name: "Standard Corporate Structure (Full Package)",
      code: "CORP_STANDARD",
      description: "Includes Basic, HRA (50%), DA (10%), Special Allowance, PF (12%), PT, and TDS (5%).",
      isActive: true,
    })
    .returning();

  // Associate rules to structure
  const structureRuleLinks = createdRules.map((rule) => ({
    salaryStructureId: standardStructure.id,
    salaryRuleId: rule.id,
    sequence: rule.sequence,
    isActive: true,
  }));

  await db.insert(salaryStructureRules).values(structureRuleLinks);
  console.log("✓ Salary rules & standard corporate structure established.\n");

  // ============================================================================
  // 9. CONTRACTS
  // ============================================================================
  console.log("📄 Seeding Employee Contracts...");

  // Monthly base wages in INR
  const wageConfig: Record<string, number> = {
    "EMP-0001": 250000.0, // Urvil Patel (CEO)
    "EMP-0002": 150000.0, // Sarah Jenkins (HR Director)
    "EMP-0003": 140000.0, // Michael Chang (Payroll Manager)
    "EMP-0004": 75000.0,  // Priya Sharma (Payroll Officer)
    "EMP-0005": 190000.0, // Marcus Vance (Systems Architect)
    "EMP-0006": 125000.0, // Alex Morgan (Senior Fullstack)
    "EMP-0007": 85000.0,  // Dev Sharma (Backend)
    "EMP-0008": 95000.0,  // Elena Rostova (Product Designer)
    "EMP-0009": 80000.0,  // Sophia Taylor (QA Automation)
    "EMP-0010": 80000.0,  // Darshan Ajudiya (Frontend)
  };

  const contractsData = allEmployees.map((emp, index) => {
    const wage = wageConfig[emp.employeeNumber] || 80000.0;
    return {
      employeeId: emp.id,
      contractNumber: `CON-2026-${String(index + 1).padStart(3, "0")}`,
      startDate: emp.joiningDate || "2024-01-01",
      departmentId: emp.departmentId,
      jobPositionId: emp.jobPositionId,
      workingScheduleId: emp.workingScheduleId,
      salaryStructureId: standardStructure.id,
      wage: wage.toFixed(2),
      currency: "INR",
      status: "active" as const,
    };
  });

  const createdContracts = await db.insert(contracts).values(contractsData).returning();
  const contractMap = new Map(createdContracts.map((c) => [c.employeeId, c]));
  console.log(`✓ Seeded ${createdContracts.length} employment contracts.\n`);

  // ============================================================================
  // 10. TIME OFF TYPES & ALLOCATIONS
  // ============================================================================
  console.log("🏖️  Seeding Time Off Types & Allocations...");
  const leaveTypesData = [
    {
      name: "Paid Time Off (Annual Leave)",
      code: "PTO",
      unit: "days" as const,
      requiresAllocation: true,
      approvalMode: "manager_and_hr" as const,
      isPaid: true,
      isActive: true,
    },
    {
      name: "Sick / Medical Leave",
      code: "SICK",
      unit: "days" as const,
      requiresAllocation: true,
      approvalMode: "manager" as const,
      isPaid: true,
      isActive: true,
    },
    {
      name: "Casual / Personal Leave",
      code: "CASUAL",
      unit: "days" as const,
      requiresAllocation: true,
      approvalMode: "manager" as const,
      isPaid: true,
      isActive: true,
    },
    {
      name: "Compensatory Off",
      code: "COMP_OFF",
      unit: "days" as const,
      requiresAllocation: true,
      approvalMode: "manager" as const,
      isPaid: true,
      isActive: true,
    },
    {
      name: "Unpaid Leave (LWP)",
      code: "UNPAID",
      unit: "days" as const,
      requiresAllocation: false,
      approvalMode: "hr" as const,
      isPaid: false,
      isActive: true,
    },
  ];

  const createdLeaveTypes = await db.insert(timeOffTypes).values(leaveTypesData).returning();
  const leaveTypeMap = new Map(createdLeaveTypes.map((lt) => [lt.code, lt]));

  // Give annual allocations to all active employees for year 2026
  const allocationsToInsert = [];
  const hrUserId = userRecordMap.get("hr.manager@peoplepay360.com");

  for (const emp of allEmployees) {
    allocationsToInsert.push(
      {
        employeeId: emp.id,
        timeOffTypeId: leaveTypeMap.get("PTO")!.id,
        allocatedAmount: "20.00",
        validFrom: "2026-01-01",
        validTo: "2026-12-31",
        status: "approved" as const,
        approvedBy: hrUserId,
        approvedAt: new Date("2026-01-01"),
      },
      {
        employeeId: emp.id,
        timeOffTypeId: leaveTypeMap.get("SICK")!.id,
        allocatedAmount: "10.00",
        validFrom: "2026-01-01",
        validTo: "2026-12-31",
        status: "approved" as const,
        approvedBy: hrUserId,
        approvedAt: new Date("2026-01-01"),
      },
      {
        employeeId: emp.id,
        timeOffTypeId: leaveTypeMap.get("CASUAL")!.id,
        allocatedAmount: "7.00",
        validFrom: "2026-01-01",
        validTo: "2026-12-31",
        status: "approved" as const,
        approvedBy: hrUserId,
        approvedAt: new Date("2026-01-01"),
      }
    );
  }

  const createdAllocations = await db.insert(timeOffAllocations).values(allocationsToInsert).returning();
  console.log(`✓ Seeded ${createdAllocations.length} leave allocations.\n`);

  // Sample Leave Requests
  console.log("📝 Seeding Leave Requests...");
  await db.insert(timeOffRequests).values([
    {
      employeeId: srEngineerEmployee.id,
      timeOffTypeId: leaveTypeMap.get("PTO")!.id,
      startDate: "2026-02-12",
      endDate: "2026-02-13",
      duration: "2.00",
      reason: "Family gathering and personal travel",
      status: "approved",
      approvedBy: userRecordMap.get("hr.manager@peoplepay360.com"),
      approvedAt: new Date("2026-02-10"),
    },
    {
      employeeId: backendEmployee.id,
      timeOffTypeId: leaveTypeMap.get("SICK")!.id,
      startDate: "2026-02-18",
      endDate: "2026-02-18",
      duration: "1.00",
      reason: "Severe migraine and doctor visit",
      status: "approved",
      approvedBy: userRecordMap.get("marcus.vance@peoplepay360.com") || userRecordMap.get("admin@peoplepay360.com"),
      approvedAt: new Date("2026-02-18"),
    },
    {
      employeeId: designerEmployee.id,
      timeOffTypeId: leaveTypeMap.get("PTO")!.id,
      startDate: "2026-03-25",
      endDate: "2026-03-27",
      duration: "3.00",
      reason: "Spring vacation trip",
      status: "pending",
    },
    {
      employeeId: qaEmployee.id,
      timeOffTypeId: leaveTypeMap.get("CASUAL")!.id,
      startDate: "2026-01-22",
      endDate: "2026-01-23",
      duration: "2.00",
      reason: "Urgent personal bank work",
      status: "refused",
      approvedBy: userRecordMap.get("hr.manager@peoplepay360.com"),
      approvedAt: new Date("2026-01-21"),
      refusalReason: "Critical release sprint window; requested reschedule to following week.",
    },
  ]);
  console.log("✓ Seeded sample leave requests.\n");

  // ============================================================================
  // 11. ATTENDANCE & ATTENDANCE CORRECTIONS
  // ============================================================================
  console.log("⏰ Seeding Attendance Records...");

  // Generate 10 days of attendance for February 2026 (business days)
  const febDates = [
    "2026-02-02",
    "2026-02-03",
    "2026-02-04",
    "2026-02-05",
    "2026-02-06",
    "2026-02-09",
    "2026-02-10",
    "2026-02-11",
    "2026-02-16",
    "2026-02-17",
  ];

  const attendanceRecords = [];
  for (const emp of allEmployees) {
    for (const dStr of febDates) {
      // Simulate minor variations: most on time (9:00 - 18:00), occasional late or overtime
      const isLate = emp.employeeNumber === "EMP-0007" && dStr === "2026-02-04";
      const isOvertime = emp.employeeNumber === "EMP-0006" && dStr === "2026-02-11";

      const checkInHour = isLate ? 9 : 9;
      const checkInMin = isLate ? 35 : 2;
      const checkOutHour = isOvertime ? 19 : 18;
      const checkOutMin = isOvertime ? 30 : 5;

      const checkIn = new Date(`${dStr}T0${checkInHour}:${String(checkInMin).padStart(2, "0")}:00+05:30`);
      const checkOut = new Date(`${dStr}T${checkOutHour}:${String(checkOutMin).padStart(2, "0")}:00+05:30`);

      const workedMinutes = isOvertime ? 570 : isLate ? 445 : 480;
      const overtimeMinutes = isOvertime ? 90 : 0;
      const status = isOvertime ? "overtime" : isLate ? "late" : "present";

      attendanceRecords.push({
        employeeId: emp.id,
        attendanceDate: dStr,
        checkIn,
        checkOut,
        workedMinutes,
        overtimeMinutes,
        status: status as any,
        isManuallyEdited: false,
        notes: isOvertime ? "Deployment sprint extended hours" : isLate ? "Metro train delay" : null,
      });
    }
  }

  const createdAttendance = await db.insert(attendance).values(attendanceRecords).returning();
  console.log(`✓ Seeded ${createdAttendance.length} attendance records.`);

  // Attendance correction request
  const sampleAtt = createdAttendance.find((a) => a.status === "late");
  const devSharmaUserId = userRecordMap.get("dev.sharma@peoplepay360.com");
  if (sampleAtt && devSharmaUserId) {
    await db.insert(attendanceCorrections).values({
      attendanceId: sampleAtt.id,
      requestedBy: devSharmaUserId,
      approvedBy: userRecordMap.get("marcus.vance@peoplepay360.com"),
      oldCheckIn: sampleAtt.checkIn,
      oldCheckOut: sampleAtt.checkOut,
      newCheckIn: new Date("2026-02-04T09:05:00+05:30"),
      newCheckOut: sampleAtt.checkOut,
      reason: "Swipe card reader on 4th floor failed to register timestamp; verified by reception entry log.",
      status: "pending",
    });
    console.log("✓ Attendance correction request logged.");
  }

  // ============================================================================
  // 12. PAYRUNS & DETAILED PAYSLIPS
  // ============================================================================
  console.log("\n💵 Seeding Monthly Payruns & Payslips...");

  const adminUserId = userRecordMap.get("admin@peoplepay360.com") || ceoEmployee.userId!;

  // 1. Paid Payrun for February 2026
  const [febPayrun] = await db
    .insert(payruns)
    .values({
      name: "Monthly Payrun - February 2026",
      salaryStructureId: standardStructure.id,
      periodStart: "2026-02-01",
      periodEnd: "2026-02-28",
      status: "paid",
      createdBy: adminUserId,
      computedAt: new Date("2026-02-27T10:00:00"),
      validatedAt: new Date("2026-02-28T14:30:00"),
      paidAt: new Date("2026-02-28T16:00:00"),
    })
    .returning();

  // 2. Draft / Computed Payrun for March 2026
  const [marchPayrun] = await db
    .insert(payruns)
    .values({
      name: "Monthly Payrun - March 2026",
      salaryStructureId: standardStructure.id,
      periodStart: "2026-03-01",
      periodEnd: "2026-03-31",
      status: "computed",
      createdBy: adminUserId,
      computedAt: new Date("2026-03-05T09:15:00"),
    })
    .returning();

  console.log(`✓ Payruns created: "${febPayrun.name}" (Paid) and "${marchPayrun.name}" (Computed).`);

  // Generate real calculated payslips for both payruns using salary-engine!
  await generatePayrunSlips(febPayrun, "paid", "2026-02");
  await generatePayrunSlips(marchPayrun, "computed", "2026-03");

  async function generatePayrunSlips(payrun: typeof febPayrun, targetStatus: "paid" | "computed", prefix: string) {
    for (let i = 0; i < allEmployees.length; i++) {
      const emp = allEmployees[i];
      const contract = contractMap.get(emp.id)!;

      // Run real salary computation engine!
      const payrollContext = {
        employee: emp,
        contract: contract,
        period: {
          start: payrun.periodStart,
          end: payrun.periodEnd,
        },
        attendance: {
          workedDays: 20,
          workedHours: 160,
          overtimeHours: emp.employeeNumber === "EMP-0006" ? 1.5 : 0,
        },
        leave: {
          paidDays: 1,
          unpaidDays: 0,
        },
        results: {},
      };

      const result = executeSalaryEngine(createdRules, payrollContext);

      const payslipNumber = `PS-${prefix}-${String(i + 1).padStart(3, "0")}`;

      const [createdSlip] = await db
        .insert(payslips)
        .values({
          payslipNumber,
          payrunId: payrun.id,
          employeeId: emp.id,
          contractId: contract.id,
          salaryStructureId: standardStructure.id,
          periodStart: payrun.periodStart,
          periodEnd: payrun.periodEnd,
          workedDays: "20.00",
          workedHours: "160.00",
          basicAmount: result.basicAmount.toFixed(2),
          grossAmount: result.grossAmount.toFixed(2),
          deductionAmount: result.deductionAmount.toFixed(2),
          netAmount: result.netAmount.toFixed(2),
          status: targetStatus,
          computedAt: payrun.computedAt,
          validatedAt: payrun.validatedAt,
          paidAt: payrun.paidAt,
        })
        .returning();

      // Insert evaluated payslip lines
      const linesData = result.lines.map((l) => ({
        payslipId: createdSlip.id,
        salaryRuleId: l.salaryRuleId,
        ruleCode: l.ruleCode,
        ruleName: l.ruleName,
        category: l.category,
        sequence: l.sequence,
        amount: l.amount.toFixed(2),
        quantity: "1.0000",
        rate: "100.0000",
        total: l.total.toFixed(2),
      }));

      await db.insert(payslipLines).values(linesData);

      // Add a couple of realistic audit warnings on computed slips
      if (targetStatus === "computed" && emp.employeeNumber === "EMP-0006") {
        await db.insert(payslipWarnings).values({
          payslipId: createdSlip.id,
          code: "OVERTIME_INCLUDED",
          severity: "info",
          message: "1.5 hours of logged overtime recorded during sprint window.",
          resolved: true,
        });
      }
    }
  }

  console.log("✓ Detailed payslips & statutory deduction lines computed and stored.\n");

  // ============================================================================
  // SUMMARY REPORT
  // ============================================================================
  console.log("══════════════════════════════════════════════════════════════════════");
  console.log("🎉 Neon Database Seeding Completed Successfully!");
  console.log("══════════════════════════════════════════════════════════════════════");
  console.log("📊 Summary of Seeded Data:");
  console.log(`   • Working Schedules:       2`);
  console.log(`   • Departments:             ${depts.length}`);
  console.log(`   • Job Positions:           ${jobs.length}`);
  console.log(`   • Employees:               ${allEmployees.length}`);
  console.log(`   • Employment Contracts:    ${createdContracts.length}`);
  console.log(`   • Time Off Types:          ${createdLeaveTypes.length}`);
  console.log(`   • Time Off Allocations:    ${createdAllocations.length}`);
  console.log(`   • Attendance Records:      ${createdAttendance.length}`);
  console.log(`   • Salary Rules:            ${createdRules.length}`);
  console.log(`   • Salary Structures:       1`);
  console.log(`   • Payruns:                 2 (February Paid, March Computed)`);
  console.log(`   • Payslips:                ${allEmployees.length * 2}`);
  console.log("──────────────────────────────────────────────────────────────────────");
  console.log("🔑 Default Test Accounts (Password: Password123!):");
  console.log("   • Admin:               admin@peoplepay360.com");
  console.log("   • HR Manager:          hr.manager@peoplepay360.com");
  console.log("   • Payroll Manager:     payroll.manager@peoplepay360.com");
  console.log("   • Payroll Officer:     payroll.officer@peoplepay360.com");
  console.log("   • Senior Engineer:     alex.morgan@peoplepay360.com");
  console.log("══════════════════════════════════════════════════════════════════════\n");
}

seed()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Seeding failed with error:", err);
    process.exit(1);
  });
