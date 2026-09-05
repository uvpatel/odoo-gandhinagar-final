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
import { eq, asc } from "drizzle-orm";

// Helper for chunked batch insertion to safely stay within Postgres parameter limits
async function insertInBatches<T>(table: any, items: T[], batchSize = 100): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    await db.insert(table).values(chunk as any);
  }
}

async function insertInBatchesReturning<T, R>(table: any, items: T[], batchSize = 100): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const res = await db.insert(table).values(chunk as any).returning();
    results.push(...(res as R[]));
  }
  return results;
}

async function seed() {
  console.log("🌱 Starting Comprehensive Neon Database Seeding for PeoplePay360 (200+ Entries)...\n");

  // ============================================================================
  // 1. CLEAN EXISTING OPERATIONAL DATA (Safe reverse dependency order)
  // Preserve existing users/accounts, but clear child tables for clean seeding
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
    { name: "Executive Leadership", code: "EXEC", description: "Strategic direction, executive governance, and board leadership." },
    { name: "Human Resources", code: "HR", description: "People operations, talent acquisition, culture, and employee relations." },
    { name: "Finance & Payroll", code: "FIN", description: "Financial planning, accounting, compliance, and payroll disbursements." },
    { name: "Engineering & Architecture", code: "ENG", description: "Fullstack web systems, cloud infrastructure, and DevOps architecture." },
    { name: "Product & UI/UX Design", code: "PROD", description: "Product roadmap, user experience research, and interface design systems." },
    { name: "Sales & Enterprise Accounts", code: "SALES", description: "Enterprise partnerships, client onboarding, and revenue growth." },
    { name: "Operations & Customer Support", code: "OPS", description: "Platform operations, client satisfaction, and internal IT enablement." },
    { name: "Data & AI Research", code: "DATA", description: "Machine learning engineering, business analytics, and automation." },
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
    { title: "Chief Financial Officer", code: "CFO", description: "Corporate finance, budget planning, and treasury" },
    { title: "HR Director", code: "HRD", description: "Head of Human Resources and organizational development" },
    { title: "People Operations Lead", code: "HR-LEAD", description: "Employee relations, perks, and internal workplace culture" },
    { title: "People Operations Specialist", code: "HR-SPEC", description: "Employee onboarding, attendance, and welfare" },
    { title: "Finance & Payroll Manager", code: "PAY-MGR", description: "Oversees salary computation, compliance, and tax withholding" },
    { title: "Senior Payroll Accountant", code: "PAY-SR", description: "Handles statutory filings, deductions, and variance audits" },
    { title: "Payroll Officer", code: "PAY-OFFICER", description: "Executes monthly payrun batches and salary slip dispatches" },
    { title: "Lead Systems Architect", code: "ENG-ARCH", description: "System design, distributed database architecture, and scalability" },
    { title: "Staff Software Engineer", code: "ENG-STAFF", description: "Cross-team architectural initiatives and technical standards" },
    { title: "Senior Fullstack Engineer", code: "ENG-SR", description: "Fullstack web apps with Next.js, PostgreSQL, and API services" },
    { title: "Fullstack Engineer", code: "ENG-FS", description: "Feature development across backend and frontend layers" },
    { title: "Backend Engineer", code: "ENG-BE", description: "Database optimization, microservices, and asynchronous queues" },
    { title: "Frontend Specialist", code: "ENG-FE", description: "Design systems, accessible interfaces, and interactive components" },
    { title: "Mobile Application Engineer", code: "ENG-MOB", description: "Native and cross-platform mobile employee portals" },
    { title: "DevOps & Cloud Engineer", code: "ENG-DEVOPS", description: "CI/CD pipelines, container orchestration, and server monitoring" },
    { title: "QA Automation Engineer", code: "ENG-QA", description: "Automated end-to-end testing and software quality assurance" },
    { title: "Senior Product Manager", code: "PROD-MGR", description: "Product lifecycle, feature prioritization, and stakeholder roadmap" },
    { title: "Technical Product Manager", code: "PROD-TPM", description: "API platform integrations and developer experience" },
    { title: "Lead Product Designer", code: "PROD-DES", description: "Design systems, UI guidelines, and user interaction flows" },
    { title: "UI/UX Designer", code: "PROD-UI", description: "Interactive wireframes, user testing, and visual design assets" },
    { title: "Enterprise Account Executive", code: "SALES-EXEC", description: "High-value enterprise client relationships and contract closing" },
    { title: "Customer Success Manager", code: "CS-MGR", description: "Client satisfaction, retention, and onboarding support" },
    { title: "Senior Data Scientist", code: "DATA-SR", description: "Predictive headcount analytics and machine learning modeling" },
  ];

  const jobs = await db.insert(jobPositions).values(jobData).returning();
  const jobMap = new Map(jobs.map((j) => [j.code, j]));
  console.log(`✓ Seeded ${jobs.length} job positions.\n`);

  // ============================================================================
  // 5. USERS & AUTHENTICATION ACCOUNTS (Keep core users and test log-ins)
  // ============================================================================
  console.log("👤 Seeding Core Users & Authentication Accounts...");
  const defaultPassword = "Password123!";
  const hashedPassword = await hashPassword(defaultPassword);

  const seedUsers = [
    { id: "usr_admin_001", name: "Admin User", email: "admin@peoplepay360.com", role: "admin" as const },
    { id: "usr_hrm_001", name: "Sarah Jenkins", email: "hr.manager@peoplepay360.com", role: "hr_manager" as const },
    { id: "usr_paymgr_001", name: "Michael Chang", email: "payroll.manager@peoplepay360.com", role: "hr_payroll_manager" as const },
    { id: "usr_payusr_001", name: "Priya Sharma", email: "payroll.officer@peoplepay360.com", role: "hr_payroll_user" as const },
    { id: "usr_emp_alex", name: "Alex Morgan", email: "alex.morgan@peoplepay360.com", role: "employee" as const },
    { id: "usr_emp_elena", name: "Elena Rostova", email: "elena.rostova@peoplepay360.com", role: "employee" as const },
    { id: "usr_emp_dev", name: "Dev Sharma", email: "dev.sharma@peoplepay360.com", role: "employee" as const },
    { id: "usr_emp_marcus", name: "Marcus Vance", email: "marcus.vance@peoplepay360.com", role: "employee" as const },
    { id: "usr_emp_sophia", name: "Sophia Taylor", email: "sophia.taylor@peoplepay360.com", role: "employee" as const },
  ];

  const userRecordMap = new Map<string, string>(); // email -> userId

  for (const u of seedUsers) {
    const [existingUser] = await db.select().from(users).where(eq(users.email, u.email)).limit(1);
    let currentUserId = u.id;
    if (existingUser) {
      currentUserId = existingUser.id;
      await db
        .update(users)
        .set({ name: u.name, role: u.role, emailVerified: true, updatedAt: new Date() })
        .where(eq(users.id, existingUser.id));
    } else {
      const [inserted] = await db
        .insert(users)
        .values({ id: u.id, name: u.name, email: u.email, emailVerified: true, role: u.role })
        .returning();
      currentUserId = inserted.id;
    }
    userRecordMap.set(u.email, currentUserId);

    const [existingAcc] = await db.select().from(accounts).where(eq(accounts.userId, currentUserId)).limit(1);
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
      await db.update(accounts).set({ password: hashedPassword }).where(eq(accounts.id, existingAcc.id));
    }
  }

  // Preserve all existing DB users into userRecordMap
  const existingDbUsers = await db.select().from(users);
  for (const u of existingDbUsers) {
    userRecordMap.set(u.email, u.id);
  }
  console.log(`✓ User accounts verified (Password: "${defaultPassword}").\n`);

  // ============================================================================
  // 6. GENERATE 200 EMPLOYEES
  // ============================================================================
  console.log("🧑‍💼 Generating 200 Comprehensive Employee Records...");

  const firstNamesPool = [
    "Aarav", "Aditi", "Rohan", "Ananya", "Vikram", "Neha", "Arjun", "Pooja", "Rahul", "Kavita",
    "Siddharth", "Meera", "Aditya", "Riya", "Karan", "Tanvi", "Varun", "Shreya", "Nikhil", "Isha",
    "Manish", "Divya", "Gaurav", "Swati", "Harsh", "Deepika", "Prateek", "Anjali", "Kunal", "Sonal",
    "Abhishek", "Preeti", "Suresh", "Sunita", "Rajesh", "Geeta", "Amit", "Nisha", "Sameer", "Rashmi",
    "Vivek", "Pallavi", "Alok", "Vandana", "Akash", "Smriti", "Deepak", "Aarti", "Tarun", "Bhavna",
    "Alexander", "Emily", "David", "Jessica", "James", "Laura", "Robert", "Chloe", "Daniel", "Samantha",
    "Ethan", "Olivia", "Lucas", "Ava", "Mason", "Mia", "Noah", "Harper", "Logan", "Evelyn",
  ];

  const lastNamesPool = [
    "Sharma", "Patel", "Verma", "Gupta", "Singh", "Shah", "Mehta", "Deshmukh", "Joshi", "Kulkarni",
    "Reddy", "Nair", "Iyer", "Rao", "Chauhan", "Bhatia", "Malhotra", "Kapoor", "Saxena", "Agarwal",
    "Bansal", "Mishra", "Pandey", "Dubey", "Trivedi", "Shukla", "Chatterjee", "Banerjee", "Mukherjee", "Dutta",
    "Sen", "Ghosh", "Das", "Choudhury", "Pillai", "Menon", "Kurian", "Varghese", "Fernandes", "D'Souza",
    "Vance", "Morgan", "Jenkins", "Chang", "Taylor", "Rostova", "Miller", "Wilson", "Anderson", "Thomas",
    "White", "Harris", "Martin", "Clark", "Lewis", "Walker", "Hall", "Allen", "Young", "King",
  ];

  const bankNamesPool = [
    "HDFC Bank",
    "ICICI Bank",
    "State Bank of India",
    "Axis Bank",
    "Kotak Mahindra Bank",
    "Bank of Baroda",
    "Punjab National Bank",
    "IndusInd Bank",
    "IDFC FIRST Bank",
  ];

  // Map of 10 primary employees to guarantee exact names & roles
  const coreEmployeesSpec = [
    { num: "EMP-0001", first: "Urvil", last: "Patel", email: "uvpatel7271@gmail.com", dept: "EXEC", job: "CEO", wage: 320000, userEmail: "uvpatel7271@gmail.com" },
    { num: "EMP-0002", first: "Sarah", last: "Jenkins", email: "hr.manager@peoplepay360.com", dept: "HR", job: "HRD", wage: 175000, userEmail: "hr.manager@peoplepay360.com" },
    { num: "EMP-0003", first: "Michael", last: "Chang", email: "payroll.manager@peoplepay360.com", dept: "FIN", job: "PAY-MGR", wage: 160000, userEmail: "payroll.manager@peoplepay360.com" },
    { num: "EMP-0004", first: "Priya", last: "Sharma", email: "payroll.officer@peoplepay360.com", dept: "FIN", job: "PAY-OFFICER", wage: 85000, userEmail: "payroll.officer@peoplepay360.com" },
    { num: "EMP-0005", first: "Marcus", last: "Vance", email: "marcus.vance@peoplepay360.com", dept: "ENG", job: "ENG-ARCH", wage: 210000, userEmail: "marcus.vance@peoplepay360.com" },
    { num: "EMP-0006", first: "Alex", last: "Morgan", email: "alex.morgan@peoplepay360.com", dept: "ENG", job: "ENG-SR", wage: 145000, userEmail: "alex.morgan@peoplepay360.com" },
    { num: "EMP-0007", first: "Dev", last: "Sharma", email: "dev.sharma@peoplepay360.com", dept: "ENG", job: "ENG-BE", wage: 95000, userEmail: "dev.sharma@peoplepay360.com" },
    { num: "EMP-0008", first: "Elena", last: "Rostova", email: "elena.rostova@peoplepay360.com", dept: "PROD", job: "PROD-DES", wage: 110000, userEmail: "elena.rostova@peoplepay360.com" },
    { num: "EMP-0009", first: "Sophia", last: "Taylor", email: "sophia.taylor@peoplepay360.com", dept: "ENG", job: "ENG-QA", wage: 90000, userEmail: "sophia.taylor@peoplepay360.com" },
    { num: "EMP-0010", first: "Darshan", last: "Ajudiya", email: "24cp020@bvmengineering.ac.in", dept: "ENG", job: "ENG-FE", wage: 95000, userEmail: "24cp020@bvmengineering.ac.in" },
  ];

  // List of department codes and matching jobs for balanced distribution
  const deptJobPool = [
    { dept: "ENG", job: "ENG-SR", minWage: 130000, maxWage: 170000 },
    { dept: "ENG", job: "ENG-FS", minWage: 80000, maxWage: 120000 },
    { dept: "ENG", job: "ENG-BE", minWage: 85000, maxWage: 125000 },
    { dept: "ENG", job: "ENG-FE", minWage: 80000, maxWage: 115000 },
    { dept: "ENG", job: "ENG-DEVOPS", minWage: 95000, maxWage: 140000 },
    { dept: "ENG", job: "ENG-QA", minWage: 70000, maxWage: 100000 },
    { dept: "ENG", job: "ENG-MOB", minWage: 85000, maxWage: 125000 },
    { dept: "PROD", job: "PROD-MGR", minWage: 120000, maxWage: 160000 },
    { dept: "PROD", job: "PROD-TPM", minWage: 110000, maxWage: 150000 },
    { dept: "PROD", job: "PROD-DES", minWage: 90000, maxWage: 130000 },
    { dept: "PROD", job: "PROD-UI", minWage: 70000, maxWage: 100000 },
    { dept: "FIN", job: "PAY-SR", minWage: 95000, maxWage: 130000 },
    { dept: "FIN", job: "PAY-OFFICER", minWage: 65000, maxWage: 85000 },
    { dept: "HR", job: "HR-LEAD", minWage: 100000, maxWage: 135000 },
    { dept: "HR", job: "HR-SPEC", minWage: 60000, maxWage: 80000 },
    { dept: "SALES", job: "SALES-EXEC", minWage: 75000, maxWage: 120000 },
    { dept: "OPS", job: "CS-MGR", minWage: 70000, maxWage: 105000 },
    { dept: "DATA", job: "DATA-SR", minWage: 125000, maxWage: 180000 },
  ];

  const employeeInsertList = [];
  const wageByEmployeeIndex = new Map<number, number>();

  // 1. Insert core 10 employees first
  for (let i = 0; i < coreEmployeesSpec.length; i++) {
    const spec = coreEmployeesSpec[i];
    const resolvedUserId = userRecordMap.get(spec.userEmail) || userRecordMap.get(spec.email) || null;
    wageByEmployeeIndex.set(i, spec.wage);

    employeeInsertList.push({
      employeeNumber: spec.num,
      userId: resolvedUserId,
      firstName: spec.first,
      lastName: spec.last,
      workEmail: spec.email,
      phone: `+91 98765 ${String(43210 + i).padStart(5, "0")}`,
      departmentId: deptMap.get(spec.dept)!.id,
      jobPositionId: jobMap.get(spec.job)!.id,
      workingScheduleId: standardSchedule.id,
      employeeType: "full_time" as const,
      status: "active" as const,
      joiningDate: "2023-01-15",
      bankName: bankNamesPool[i % bankNamesPool.length],
      bankAccountNumber: `50100${String(100000000 + i * 137).slice(0, 9)}`,
    });
  }

  // 2. Generate employees from index 10 to 199 (200 total)
  const usedEmails = new Set<string>(coreEmployeesSpec.map((s) => s.email.toLowerCase()));

  for (let i = 10; i < 200; i++) {
    const fnIndex = i % firstNamesPool.length;
    const lnIndex = Math.floor(i / firstNamesPool.length + i * 3) % lastNamesPool.length;
    const first = firstNamesPool[fnIndex];
    const last = lastNamesPool[lnIndex];

    let email = `${first.toLowerCase()}.${last.toLowerCase()}@peoplepay360.com`;
    if (usedEmails.has(email)) {
      email = `${first.toLowerCase()}.${last.toLowerCase()}${i}@peoplepay360.com`;
    }
    usedEmails.add(email);

    const poolPick = deptJobPool[i % deptJobPool.length];
    const dept = deptMap.get(poolPick.dept)!;
    const job = jobMap.get(poolPick.job)!;

    // Calculate a realistic wage rounded to thousands
    const rawWage = poolPick.minWage + ((i * 3500) % (poolPick.maxWage - poolPick.minWage));
    const roundedWage = Math.round(rawWage / 1000) * 1000;
    wageByEmployeeIndex.set(i, roundedWage);

    // Randomize joining date between 2022 and 2025
    const year = 2022 + (i % 4);
    const month = String((i % 12) + 1).padStart(2, "0");
    const day = String((i % 28) + 1).padStart(2, "0");
    const joiningDate = `${year}-${month}-${day}`;

    const empNumber = `EMP-${String(i + 1).padStart(4, "0")}`;
    const schedule = i % 8 === 0 ? flexSchedule : standardSchedule;
    const empType = i % 15 === 0 ? "contract" : i % 20 === 0 ? "part_time" : "full_time";
    const empStatus = i % 35 === 0 ? "draft" : "active";

    employeeInsertList.push({
      employeeNumber: empNumber,
      userId: null,
      firstName: first,
      lastName: last,
      workEmail: email,
      phone: `+91 ${90000 + (i % 9999)} ${String(10000 + (i * 73) % 89999)}`,
      departmentId: dept.id,
      jobPositionId: job.id,
      workingScheduleId: schedule.id,
      employeeType: empType as any,
      status: empStatus as any,
      joiningDate,
      bankName: bankNamesPool[i % bankNamesPool.length],
      bankAccountNumber: `60200${String(100000000 + i * 293).slice(0, 9)}`,
    });
  }

  // Insert all 200 employees in batches of 50
  const createdEmployees = await insertInBatchesReturning<any, any>(employees, employeeInsertList, 50);
  console.log(`✓ Successfully seeded ${createdEmployees.length} employee records.\n`);

  // ============================================================================
  // 7. SALARY RULES & STANDARD STRUCTURE
  // ============================================================================
  console.log("💰 Seeding Salary Rules & Structure...");

  const rulesData = [
    { name: "Basic Salary", code: "BASIC", category: "basic" as const, computationType: "fixed" as const, sequence: 10, isActive: true },
    { name: "House Rent Allowance", code: "HRA", category: "allowance" as const, computationType: "percentage" as const, percentage: "50.0000", percentageBase: "BASIC", sequence: 20, isActive: true },
    { name: "Dearness Allowance", code: "DA", category: "allowance" as const, computationType: "percentage" as const, percentage: "10.0000", percentageBase: "BASIC", sequence: 30, isActive: true },
    { name: "Special Allowance", code: "SPECIAL", category: "allowance" as const, computationType: "fixed" as const, fixedAmount: "5000.00", sequence: 40, isActive: true },
    { name: "Gross Salary", code: "GROSS", category: "gross" as const, computationType: "formula" as const, formula: "BASIC + HRA + DA + SPECIAL", sequence: 100, isActive: true },
    { name: "Provident Fund (Employee)", code: "PF", category: "deduction" as const, computationType: "percentage" as const, percentage: "12.0000", percentageBase: "BASIC", sequence: 120, isActive: true },
    { name: "Professional Tax", code: "PT", category: "deduction" as const, computationType: "fixed" as const, fixedAmount: "200.00", sequence: 130, isActive: true },
    { name: "Tax Deducted at Source (TDS)", code: "TDS", category: "deduction" as const, computationType: "percentage" as const, percentage: "5.0000", percentageBase: "GROSS", sequence: 140, isActive: true },
    { name: "Total Deductions", code: "DEDUCTIONS", category: "deduction" as const, computationType: "formula" as const, formula: "PF + PT + TDS", sequence: 190, isActive: true },
    { name: "Net Salary", code: "NET", category: "net" as const, computationType: "formula" as const, formula: "GROSS - DEDUCTIONS", sequence: 200, isActive: true },
  ];

  const createdRules = await db.insert(salaryRules).values(rulesData).returning();

  const [standardStructure] = await db
    .insert(salaryStructures)
    .values({
      name: "Standard Corporate Structure (Full Package)",
      code: "CORP_STANDARD",
      description: "Includes Basic, HRA (50%), DA (10%), Special Allowance, PF (12%), PT, and TDS (5%).",
      isActive: true,
    })
    .returning();

  const structureRuleLinks = createdRules.map((rule) => ({
    salaryStructureId: standardStructure.id,
    salaryRuleId: rule.id,
    sequence: rule.sequence,
    isActive: true,
  }));

  await db.insert(salaryStructureRules).values(structureRuleLinks);
  console.log("✓ Salary rules & standard corporate structure established.\n");

  // ============================================================================
  // 8. 200 EMPLOYMENT CONTRACTS
  // ============================================================================
  console.log("📄 Seeding 200 Employment Contracts...");

  const contractsData = createdEmployees.map((emp, index) => {
    const wage = wageByEmployeeIndex.get(index) || 80000.0;
    return {
      employeeId: emp.id,
      contractNumber: `CON-2026-${String(index + 1).padStart(4, "0")}`,
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

  const createdContracts = await insertInBatchesReturning<any, any>(contracts, contractsData, 50);
  const contractMap = new Map(createdContracts.map((c) => [c.employeeId, c]));
  console.log(`✓ Seeded ${createdContracts.length} employment contracts.\n`);

  // ============================================================================
  // 9. TIME OFF TYPES & 600 ALLOCATIONS
  // ============================================================================
  console.log("🏖️  Seeding Time Off Types & Allocations for 200 Employees...");
  const leaveTypesData = [
    { name: "Paid Time Off (Annual Leave)", code: "PTO", unit: "days" as const, requiresAllocation: true, approvalMode: "manager_and_hr" as const, isPaid: true, isActive: true },
    { name: "Sick / Medical Leave", code: "SICK", unit: "days" as const, requiresAllocation: true, approvalMode: "manager" as const, isPaid: true, isActive: true },
    { name: "Casual / Personal Leave", code: "CASUAL", unit: "days" as const, requiresAllocation: true, approvalMode: "manager" as const, isPaid: true, isActive: true },
    { name: "Compensatory Off", code: "COMP_OFF", unit: "days" as const, requiresAllocation: true, approvalMode: "manager" as const, isPaid: true, isActive: true },
    { name: "Unpaid Leave (LWP)", code: "UNPAID", unit: "days" as const, requiresAllocation: false, approvalMode: "hr" as const, isPaid: false, isActive: true },
  ];

  const createdLeaveTypes = await db.insert(timeOffTypes).values(leaveTypesData).returning();
  const leaveTypeMap = new Map(createdLeaveTypes.map((lt) => [lt.code, lt]));

  const allocationsToInsert = [];
  const hrUserId = userRecordMap.get("hr.manager@peoplepay360.com");

  for (const emp of createdEmployees) {
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

  await insertInBatches(timeOffAllocations, allocationsToInsert, 100);
  console.log(`✓ Seeded ${allocationsToInsert.length} leave allocations (3 per employee).\n`);

  // Sample Leave Requests across staff
  console.log("📝 Seeding Sample Leave Requests...");
  const sampleRequests = [];
  for (let i = 0; i < 40; i++) {
    const emp = createdEmployees[i * 5];
    const isApproved = i % 4 !== 3;
    const isPending = i % 4 === 1;
    const typeCode = i % 3 === 0 ? "PTO" : i % 3 === 1 ? "SICK" : "CASUAL";

    sampleRequests.push({
      employeeId: emp.id,
      timeOffTypeId: leaveTypeMap.get(typeCode)!.id,
      startDate: `2026-02-${String((i % 20) + 1).padStart(2, "0")}`,
      endDate: `2026-02-${String((i % 20) + 2).padStart(2, "0")}`,
      duration: "2.00",
      reason: i % 2 === 0 ? "Family vacation and travel" : "Medical checkup and recovery",
      status: isPending ? "pending" : isApproved ? "approved" : "refused",
      approvedBy: isApproved ? hrUserId : undefined,
      approvedAt: isApproved ? new Date("2026-01-28") : undefined,
      refusalReason: !isApproved && !isPending ? "Sprint window conflict" : undefined,
    });
  }

  await insertInBatches(timeOffRequests, sampleRequests, 50);
  console.log(`✓ Seeded ${sampleRequests.length} leave requests.\n`);

  // ============================================================================
  // 10. ATTENDANCE RECORDS (2,000+ entries)
  // ============================================================================
  console.log("⏰ Seeding Attendance Records for 200 Employees (10 days = 2,000 records)...");

  const febDates = [
    "2026-02-02", "2026-02-03", "2026-02-04", "2026-02-05", "2026-02-06",
    "2026-02-09", "2026-02-10", "2026-02-11", "2026-02-16", "2026-02-17",
  ];

  const attendanceRecords = [];
  for (let i = 0; i < createdEmployees.length; i++) {
    const emp = createdEmployees[i];
    for (let d = 0; d < febDates.length; d++) {
      const dStr = febDates[d];
      const isLate = (i + d) % 19 === 0;
      const isOvertime = (i + d) % 13 === 0;

      const checkInHour = 9;
      const checkInMin = isLate ? 35 : (i * 3 + d * 2) % 15;
      const checkOutHour = isOvertime ? 19 : 18;
      const checkOutMin = isOvertime ? 30 : (i * 2 + d * 4) % 15;

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
        notes: isOvertime ? "Project sprint hours" : isLate ? "Transit delay" : null,
      });
    }
  }

  await insertInBatches(attendance, attendanceRecords, 100);
  console.log(`✓ Seeded ${attendanceRecords.length} attendance records.\n`);

  // ============================================================================
  // 11. PAYRUNS & 400 CALCULATED PAYSLIPS
  // ============================================================================
  console.log("💵 Seeding 2 Full Monthly Payruns (200 Payslips Each = 400 Payslips)...");

  const adminUserId = userRecordMap.get("admin@peoplepay360.com") || userRecordMap.get("uvpatel7271@gmail.com")!;

  // 1. February 2026 Payrun (PAID)
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

  // 2. March 2026 Payrun (VALIDATED)
  const [marchPayrun] = await db
    .insert(payruns)
    .values({
      name: "Monthly Payrun - March 2026",
      salaryStructureId: standardStructure.id,
      periodStart: "2026-03-01",
      periodEnd: "2026-03-31",
      status: "validated",
      createdBy: adminUserId,
      computedAt: new Date("2026-03-01T09:15:00"),
      validatedAt: new Date("2026-03-03T11:00:00"),
    })
    .returning();

  console.log(`✓ Payruns created: "${febPayrun.name}" (Paid) and "${marchPayrun.name}" (Validated).`);

  // Salary Engine execution & batch payslip creation
  async function generatePayrunSlips(payrun: typeof febPayrun, targetStatus: "paid" | "validated", prefix: string) {
    console.log(`   ⚙️  Calculating 200 payslips for ${payrun.name}...`);
    const slipsToInsert = [];
    const evaluationResults = [];

    for (let i = 0; i < createdEmployees.length; i++) {
      const emp = createdEmployees[i];
      const contract = contractMap.get(emp.id)!;

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
          overtimeHours: (i % 7 === 0) ? 2.0 : 0,
        },
        leave: {
          paidDays: 1,
          unpaidDays: 0,
        },
        results: {},
      };

      const result = executeSalaryEngine(createdRules, payrollContext);
      const payslipNumber = `PS-${prefix}-${String(i + 1).padStart(4, "0")}`;

      slipsToInsert.push({
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
      });

      evaluationResults.push(result);
    }

    // Insert all 200 payslips in batches
    const insertedSlips = await insertInBatchesReturning<any, any>(payslips, slipsToInsert, 50);

    // Build and insert all itemized lines
    const allLinesToInsert = [];
    const warningsToInsert = [];

    for (let i = 0; i < insertedSlips.length; i++) {
      const slip = insertedSlips[i];
      const result = evaluationResults[i];

      for (const l of result.lines) {
        allLinesToInsert.push({
          payslipId: slip.id,
          salaryRuleId: l.salaryRuleId,
          ruleCode: l.ruleCode,
          ruleName: l.ruleName,
          category: l.category,
          sequence: l.sequence,
          amount: l.amount.toFixed(2),
          quantity: "1.0000",
          rate: "100.0000",
          total: l.total.toFixed(2),
        });
      }

      if (i % 11 === 0) {
        warningsToInsert.push({
          payslipId: slip.id,
          code: "ATTENDANCE_OVERTIME",
          severity: "info",
          message: "Statutory overtime hours calculated and verified against biometric punch log.",
          resolved: true,
        });
      }
    }

    await insertInBatches(payslipLines, allLinesToInsert, 100);
    if (warningsToInsert.length > 0) {
      await insertInBatches(payslipWarnings, warningsToInsert, 50);
    }

    console.log(`   ✓ ${insertedSlips.length} payslips and ${allLinesToInsert.length} line items stored.`);
  }

  await generatePayrunSlips(febPayrun, "paid", "2026-02");
  await generatePayrunSlips(marchPayrun, "validated", "2026-03");

  // ============================================================================
  // SUMMARY REPORT
  // ============================================================================
  console.log("\n══════════════════════════════════════════════════════════════════════");
  console.log("🎉 Neon Database Seeding Completed Successfully with 200+ Entries!");
  console.log("══════════════════════════════════════════════════════════════════════");
  console.log("📊 Summary of Seeded Data:");
  console.log(`   • Working Schedules:       2`);
  console.log(`   • Departments:             ${depts.length}`);
  console.log(`   • Job Positions:           ${jobs.length}`);
  console.log(`   • Employees:               ${createdEmployees.length} (EMP-0001 to EMP-0200)`);
  console.log(`   • Employment Contracts:    ${createdContracts.length} (CON-2026-0001 to CON-2026-0200)`);
  console.log(`   • Time Off Types:          ${createdLeaveTypes.length}`);
  console.log(`   • Time Off Allocations:    ${allocationsToInsert.length}`);
  console.log(`   • Leave Requests:          ${sampleRequests.length}`);
  console.log(`   • Attendance Records:      ${attendanceRecords.length}`);
  console.log(`   • Salary Rules:            ${createdRules.length}`);
  console.log(`   • Salary Structures:       1`);
  console.log(`   • Payruns:                 2 (February Paid, March Validated)`);
  console.log(`   • Payslips:                400 (200 in Feb, 200 in March)`);
  console.log("──────────────────────────────────────────────────────────────────────");
  console.log("🔑 Default Test Accounts (Password: Password123!):");
  console.log("   • Admin:               admin@peoplepay360.com");
  console.log("   • HR Manager:          hr.manager@peoplepay360.com");
  console.log("   • Payroll Manager:     payroll.manager@peoplepay360.com");
  console.log("   • Payroll Officer:     payroll.officer@peoplepay360.com");
  console.log("   • Senior Engineer:     alex.morgan@peoplepay360.com");
  console.log("   • Personal Employee:   uvpatel7271@gmail.com / 24cp020@bvmengineering.ac.in");
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
