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
  type SalaryRule,
} from "@/db/schema";
import { hashPassword } from "better-auth/crypto";
import { executeSalaryEngine } from "@/server/services/payroll/salary-engine";
import { eq } from "drizzle-orm";

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
  console.log("🌱 Starting Comprehensive Enterprise Seeding for PeoplePay360 (Full Variety Data)...\n");

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
      name: "Standard Corporate Workweek (Mon-Fri 9AM-6PM, 40h)",
      scheduleType: "standard",
      timezone: "Asia/Kolkata",
      isActive: true,
    })
    .returning();

  const [flexSchedule] = await db
    .insert(workingSchedules)
    .values({
      name: "Flexible Engineering Shift (Mon-Fri 10AM-7PM, 40h)",
      scheduleType: "shift",
      timezone: "Asia/Kolkata",
      isActive: true,
    })
    .returning();

  const [opsSchedule] = await db
    .insert(workingSchedules)
    .values({
      name: "Operations & Support Shift (Tue-Sat 10AM-7PM, 40h)",
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

  const opsScheduleLines = [2, 3, 4, 5, 6].map((day) => ({
    scheduleId: opsSchedule.id,
    dayOfWeek: day,
    startTime: "10:00:00",
    endTime: "19:00:00",
    breakMinutes: 60,
  }));

  await db.insert(workingScheduleLines).values([...standardScheduleLines, ...flexScheduleLines, ...opsScheduleLines]);
  console.log("✓ Working schedules created (Standard, Flex, Ops).\n");

  // ============================================================================
  // 3. DEPARTMENTS
  // ============================================================================
  console.log("🏢 Seeding Departments...");
  const deptData = [
    { name: "Executive Leadership", code: "EXEC", description: "Strategic direction, executive governance, and board leadership." },
    { name: "Human Resources", code: "HR", description: "People operations, talent acquisition, culture, and employee relations." },
    { name: "Finance & Payroll", code: "FIN", description: "Financial planning, accounting, statutory compliance, and payroll disbursements." },
    { name: "Engineering & Architecture", code: "ENG", description: "Fullstack web systems, distributed cloud architecture, and DevOps infrastructure." },
    { name: "Product & UI/UX Design", code: "PROD", description: "Product roadmap, user experience research, design systems, and product analytics." },
    { name: "Sales & Enterprise Accounts", code: "SALES", description: "Enterprise partnerships, client onboarding, revenue strategy, and account growth." },
    { name: "Operations & Customer Support", code: "OPS", description: "Platform operations, 24/7 client satisfaction, IT service management, and customer success." },
    { name: "Data & AI Research", code: "DATA", description: "Predictive analytics, deep learning models, workflow automation, and data platform engineering." },
  ];

  const depts = await db.insert(departments).values(deptData).returning();
  const deptMap = new Map(depts.map((d) => [d.code, d]));
  console.log(`✓ Seeded ${depts.length} departments.\n`);

  // ============================================================================
  // 4. JOB POSITIONS
  // ============================================================================
  console.log("💼 Seeding Job Positions...");
  const jobData = [
    { title: "Chief Executive Officer", code: "CEO", description: "Overall enterprise vision, strategic direction, and stakeholder governance" },
    { title: "Chief Technology Officer", code: "CTO", description: "Technical architecture, infrastructure scalability, and engineering leadership" },
    { title: "Chief Financial Officer", code: "CFO", description: "Corporate treasury, financial strategy, and regulatory compliance" },
    { title: "HR Director", code: "HRD", description: "Human resources strategy, talent development, and organizational culture" },
    { title: "People Operations Lead", code: "HR-LEAD", description: "Employee relations, total rewards, and internal workplace experience" },
    { title: "People Operations Specialist", code: "HR-SPEC", description: "Employee lifecycle onboarding, attendance audit, and employee welfare" },
    { title: "Finance & Payroll Manager", code: "PAY-MGR", description: "Oversees payroll disbursements, variance audits, and statutory deductions" },
    { title: "Senior Payroll Accountant", code: "PAY-SR", description: "Statutory tax filings, EPF/ESIC reconciliation, and audit documentation" },
    { title: "Payroll Officer", code: "PAY-OFFICER", description: "Monthly payrun execution, attendance verification, and payslip distribution" },
    { title: "Lead Systems Architect", code: "ENG-ARCH", description: "Distributed systems, database schemas, and microservice integration" },
    { title: "Staff Software Engineer", code: "ENG-STAFF", description: "Cross-functional engineering initiatives, core platform reliability, and mentoring" },
    { title: "Senior Fullstack Engineer", code: "ENG-SR", description: "Modern web architecture with Next.js, PostgreSQL, and performant REST/GraphQL APIs" },
    { title: "Fullstack Engineer", code: "ENG-FS", description: "Feature development across responsive frontends and backend services" },
    { title: "Senior Backend Engineer", code: "ENG-BE", description: "Database query optimization, event queues, and transaction integrity" },
    { title: "Senior Frontend Specialist", code: "ENG-FE", description: "Accessible UI components, client performance tuning, and design system engineering" },
    { title: "Mobile Applications Lead", code: "ENG-MOB", description: "Native and cross-platform mobile employee portals and self-service tools" },
    { title: "DevOps & Cloud Architect", code: "ENG-DEVOPS", description: "Automated CI/CD pipelines, Kubernetes, monitoring, and cloud security" },
    { title: "QA Automation Lead", code: "ENG-QA", description: "End-to-end integration testing, regression automation, and test pipelines" },
    { title: "Senior Product Manager", code: "PROD-MGR", description: "Product roadmap prioritization, PRDs, and enterprise user metrics" },
    { title: "Technical Product Manager", code: "PROD-TPM", description: "API platform integrations, developer experience, and backend specifications" },
    { title: "Lead UI/UX Designer", code: "PROD-DES", description: "Design systems, human-centered UX research, and visual brand guidelines" },
    { title: "Product Designer", code: "PROD-UI", description: "Interactive prototypes, design tokens, usability testing, and wireframes" },
    { title: "Enterprise Account Executive", code: "SALES-EXEC", description: "High-value enterprise partnerships, contract negotiation, and customer acquisition" },
    { title: "Customer Success Lead", code: "CS-MGR", description: "Enterprise client satisfaction, onboarding journeys, and account retention" },
    { title: "Senior Data Scientist", code: "DATA-SR", description: "Predictive headcount attrition models, compensation benchmarking, and ML research" },
    { title: "Machine Learning Engineer", code: "DATA-ML", description: "Production ML pipelines, embedding models, and automated classification" },
  ];

  const jobs = await db.insert(jobPositions).values(jobData).returning();
  const jobMap = new Map(jobs.map((j) => [j.code, j]));
  console.log(`✓ Seeded ${jobs.length} job positions.\n`);

  // ============================================================================
  // 5. USERS & AUTHENTICATION ACCOUNTS
  // ============================================================================
  console.log("👤 Seeding Core Users & Authentication Accounts...");
  const defaultPassword = "Password123!";
  const hashedPassword = await hashPassword(defaultPassword);

  const seedUsers = [
    { id: "usr_admin_001", name: "Admin User", email: "admin@peoplepay360.com", role: "admin" as const },
    { id: "usr_hrm_001", name: "Sarah Jenkins", email: "hr.manager@peoplepay360.com", role: "hr_manager" as const },
    { id: "usr_paymgr_001", name: "Michael Chang", email: "payroll.manager@peoplepay360.com", role: "hr_payroll_manager" as const },
    { id: "usr_payusr_001", name: "Priya Sharma", email: "payroll.officer@peoplepay360.com", role: "hr_payroll_user" as const },
    { id: "usr_emp_marcus", name: "Marcus Vance", email: "marcus.vance@peoplepay360.com", role: "employee" as const },
    { id: "usr_emp_alex", name: "Alex Morgan", email: "alex.morgan@peoplepay360.com", role: "employee" as const },
    { id: "usr_emp_dev", name: "Dev Sharma", email: "dev.sharma@peoplepay360.com", role: "employee" as const },
    { id: "usr_emp_elena", name: "Elena Rostova", email: "elena.rostova@peoplepay360.com", role: "employee" as const },
    { id: "usr_emp_sophia", name: "Sophia Taylor", email: "sophia.taylor@peoplepay360.com", role: "employee" as const },
    { id: "usr_emp_urvil", name: "Urvil Patel", email: "uvpatel7271@gmail.com", role: "admin" as const },
    { id: "usr_emp_darshan", name: "Darshan Ajudiya", email: "24cp020@bvmengineering.ac.in", role: "employee" as const },
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

  // Preserve any other existing DB users into userRecordMap
  const existingDbUsers = await db.select().from(users);
  for (const u of existingDbUsers) {
    userRecordMap.set(u.email, u.id);
  }
  console.log(`✓ User accounts verified (Default password: "${defaultPassword}").\n`);

  // ============================================================================
  // 6. GENERATE 200 REALISTIC EMPLOYEES
  // ============================================================================
  console.log("🧑‍💼 Generating 200 Realistic Enterprise Employee Records...");

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

  // Core 10 employees with exact job & department mappings
  const coreEmployeesSpec = [
    { num: "EMP-0001", first: "Urvil", last: "Patel", email: "uvpatel7271@gmail.com", dept: "EXEC", job: "CEO", wage: 325000, joiningDate: "2021-01-15", schedule: standardSchedule, userEmail: "uvpatel7271@gmail.com" },
    { num: "EMP-0002", first: "Sarah", last: "Jenkins", email: "hr.manager@peoplepay360.com", dept: "HR", job: "HRD", wage: 185000, joiningDate: "2021-03-01", schedule: standardSchedule, userEmail: "hr.manager@peoplepay360.com" },
    { num: "EMP-0003", first: "Michael", last: "Chang", email: "payroll.manager@peoplepay360.com", dept: "FIN", job: "PAY-MGR", wage: 165000, joiningDate: "2021-06-15", schedule: standardSchedule, userEmail: "payroll.manager@peoplepay360.com" },
    { num: "EMP-0004", first: "Priya", last: "Sharma", email: "payroll.officer@peoplepay360.com", dept: "FIN", job: "PAY-OFFICER", wage: 88000, joiningDate: "2022-02-10", schedule: standardSchedule, userEmail: "payroll.officer@peoplepay360.com" },
    { num: "EMP-0005", first: "Marcus", last: "Vance", email: "marcus.vance@peoplepay360.com", dept: "ENG", job: "ENG-ARCH", wage: 220000, joiningDate: "2021-04-12", schedule: standardSchedule, userEmail: "marcus.vance@peoplepay360.com" },
    { num: "EMP-0006", first: "Alex", last: "Morgan", email: "alex.morgan@peoplepay360.com", dept: "ENG", job: "ENG-SR", wage: 155000, joiningDate: "2022-01-10", schedule: flexSchedule, userEmail: "alex.morgan@peoplepay360.com" },
    { num: "EMP-0007", first: "Dev", last: "Sharma", email: "dev.sharma@peoplepay360.com", dept: "ENG", job: "ENG-BE", wage: 110000, joiningDate: "2022-08-01", schedule: flexSchedule, userEmail: "dev.sharma@peoplepay360.com" },
    { num: "EMP-0008", first: "Elena", last: "Rostova", email: "elena.rostova@peoplepay360.com", dept: "PROD", job: "PROD-DES", wage: 125000, joiningDate: "2022-03-15", schedule: standardSchedule, userEmail: "elena.rostova@peoplepay360.com" },
    { num: "EMP-0009", first: "Sophia", last: "Taylor", email: "sophia.taylor@peoplepay360.com", dept: "ENG", job: "ENG-QA", wage: 98000, joiningDate: "2022-10-01", schedule: standardSchedule, userEmail: "sophia.taylor@peoplepay360.com" },
    { num: "EMP-0010", first: "Darshan", last: "Ajudiya", email: "24cp020@bvmengineering.ac.in", dept: "ENG", job: "ENG-FE", wage: 102000, joiningDate: "2023-01-09", schedule: flexSchedule, userEmail: "24cp020@bvmengineering.ac.in" },
  ];

  // Distribution pool for the remaining 190 employees
  const roleDistribution = [
    { dept: "ENG", job: "ENG-STAFF", minWage: 175000, maxWage: 215000, schedule: standardSchedule },
    { dept: "ENG", job: "ENG-SR", minWage: 135000, maxWage: 165000, schedule: flexSchedule },
    { dept: "ENG", job: "ENG-FS", minWage: 90000, maxWage: 125000, schedule: flexSchedule },
    { dept: "ENG", job: "ENG-BE", minWage: 95000, maxWage: 130000, schedule: flexSchedule },
    { dept: "ENG", job: "ENG-FE", minWage: 85000, maxWage: 120000, schedule: flexSchedule },
    { dept: "ENG", job: "ENG-DEVOPS", minWage: 110000, maxWage: 155000, schedule: standardSchedule },
    { dept: "ENG", job: "ENG-QA", minWage: 75000, maxWage: 105000, schedule: standardSchedule },
    { dept: "ENG", job: "ENG-MOB", minWage: 95000, maxWage: 135000, schedule: flexSchedule },
    { dept: "PROD", job: "PROD-MGR", minWage: 130000, maxWage: 175000, schedule: standardSchedule },
    { dept: "PROD", job: "PROD-TPM", minWage: 115000, maxWage: 160000, schedule: standardSchedule },
    { dept: "PROD", job: "PROD-DES", minWage: 95000, maxWage: 140000, schedule: standardSchedule },
    { dept: "PROD", job: "PROD-UI", minWage: 75000, maxWage: 105000, schedule: standardSchedule },
    { dept: "FIN", job: "PAY-SR", minWage: 100000, maxWage: 140000, schedule: standardSchedule },
    { dept: "FIN", job: "PAY-OFFICER", minWage: 70000, maxWage: 95000, schedule: standardSchedule },
    { dept: "HR", job: "HR-LEAD", minWage: 105000, maxWage: 145000, schedule: standardSchedule },
    { dept: "HR", job: "HR-SPEC", minWage: 65000, maxWage: 88000, schedule: standardSchedule },
    { dept: "SALES", job: "SALES-EXEC", minWage: 80000, maxWage: 135000, schedule: standardSchedule },
    { dept: "OPS", job: "CS-MGR", minWage: 75000, maxWage: 115000, schedule: opsSchedule },
    { dept: "DATA", job: "DATA-SR", minWage: 140000, maxWage: 195000, schedule: standardSchedule },
    { dept: "DATA", job: "DATA-ML", minWage: 105000, maxWage: 150000, schedule: flexSchedule },
  ];

  const employeeInsertList = [];
  const wageByEmployeeIndex = new Map<number, number>();

  // 1. Insert core 10 employees
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
      phone: `+91 98250 ${String(11000 + i * 47).slice(0, 5)}`,
      departmentId: deptMap.get(spec.dept)!.id,
      jobPositionId: jobMap.get(spec.job)!.id,
      workingScheduleId: spec.schedule.id,
      employeeType: "full_time" as const,
      status: "active" as const,
      joiningDate: spec.joiningDate,
      bankName: bankNamesPool[i % bankNamesPool.length],
      bankAccountNumber: `50100${String(100000000 + i * 379).slice(0, 9)}`,
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

    const poolPick = roleDistribution[i % roleDistribution.length];
    const dept = deptMap.get(poolPick.dept)!;
    const job = jobMap.get(poolPick.job)!;

    // Realistic wage graduated by index
    const wageSpan = poolPick.maxWage - poolPick.minWage;
    const wageStep = (i * 4700) % wageSpan;
    const roundedWage = Math.round((poolPick.minWage + wageStep) / 1000) * 1000;
    wageByEmployeeIndex.set(i, roundedWage);

    // Realistic joining dates spanning 2021 through 2025
    const joinYear = 2021 + (i % 5);
    const joinMonth = String((i % 12) + 1).padStart(2, "0");
    const joinDay = String((i % 26) + 1).padStart(2, "0");
    const joiningDate = `${joinYear}-${joinMonth}-${joinDay}`;

    const empNumber = `EMP-${String(i + 1).padStart(4, "0")}`;
    const empType = i % 18 === 0 ? "contract" : i % 25 === 0 ? "part_time" : i % 40 === 0 ? "intern" : "full_time";
    const empStatus = i % 45 === 0 ? "draft" : i % 65 === 0 ? "inactive" : "active";

    employeeInsertList.push({
      employeeNumber: empNumber,
      userId: null,
      firstName: first,
      lastName: last,
      workEmail: email,
      phone: `+91 ${98000 + (i % 1999)} ${String(20000 + (i * 83) % 79999)}`,
      departmentId: dept.id,
      jobPositionId: job.id,
      workingScheduleId: poolPick.schedule.id,
      employeeType: empType as any,
      status: empStatus as any,
      joiningDate,
      bankName: bankNamesPool[i % bankNamesPool.length],
      bankAccountNumber: `60200${String(100000000 + i * 293).slice(0, 9)}`,
    });
  }

  const createdEmployees = await insertInBatchesReturning<any, any>(employees, employeeInsertList, 50);
  console.log(`✓ Successfully seeded ${createdEmployees.length} employee records.\n`);

  // Assign department managers (Sarah Jenkins for HR, Michael Chang for FIN, Marcus Vance for ENG, Elena Rostova for PROD)
  console.log("🔗 Linking Employees to Department Managers...");
  const hrManagerEmp = createdEmployees.find((e) => e.employeeNumber === "EMP-0002");
  const finManagerEmp = createdEmployees.find((e) => e.employeeNumber === "EMP-0003");
  const engLeadEmp = createdEmployees.find((e) => e.employeeNumber === "EMP-0005");
  const prodLeadEmp = createdEmployees.find((e) => e.employeeNumber === "EMP-0008");

  for (const emp of createdEmployees) {
    let mgrId = null;
    if (emp.departmentId === deptMap.get("HR")?.id && emp.id !== hrManagerEmp?.id) mgrId = hrManagerEmp?.id;
    else if (emp.departmentId === deptMap.get("FIN")?.id && emp.id !== finManagerEmp?.id) mgrId = finManagerEmp?.id;
    else if (emp.departmentId === deptMap.get("ENG")?.id && emp.id !== engLeadEmp?.id) mgrId = engLeadEmp?.id;
    else if (emp.departmentId === deptMap.get("PROD")?.id && emp.id !== prodLeadEmp?.id) mgrId = prodLeadEmp?.id;

    if (mgrId) {
      await db.update(employees).set({ managerId: mgrId }).where(eq(employees.id, emp.id));
    }
  }
  console.log("✓ Manager hierarchies linked.\n");

  // ============================================================================
  // 7. EMPLOYEE HISTORY (Promotions, Transfers, Tenure Milestones)
  // ============================================================================
  console.log("📜 Seeding Career Milestones & Promotion History (45+ records)...");
  const historyEvents = [];
  for (let i = 0; i < 25; i++) {
    const emp = createdEmployees[i];
    historyEvents.push({
      employeeId: emp.id,
      eventType: "promotion",
      effectiveDate: "2025-01-01",
      previousDepartmentId: emp.departmentId,
      newDepartmentId: emp.departmentId,
      previousJobPositionId: jobMap.get("ENG-FS")?.id || emp.jobPositionId,
      newJobPositionId: emp.jobPositionId,
      notes: "Annual merit promotion following outstanding performance review and technical leadership.",
    });
  }
  for (let i = 25; i < 45; i++) {
    const emp = createdEmployees[i];
    historyEvents.push({
      employeeId: emp.id,
      eventType: "compensation_revision",
      effectiveDate: "2025-04-01",
      previousDepartmentId: emp.departmentId,
      newDepartmentId: emp.departmentId,
      previousJobPositionId: emp.jobPositionId,
      newJobPositionId: emp.jobPositionId,
      notes: "Band compensation alignment and annual market adjustment.",
    });
  }
  await insertInBatches(employeeHistory, historyEvents, 50);
  console.log(`✓ Seeded ${historyEvents.length} career history records.\n`);

  // ============================================================================
  // 8. SALARY RULES & 3 DISTINCT STRUCTURES
  // ============================================================================
  console.log("💰 Seeding Salary Rules & Multi-Structure Matrix...");

  const rulesData = [
    // Shared Base Rules
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

    // Executive Rules
    { name: "Executive Allowance", code: "EXEC_ALLOW", category: "allowance" as const, computationType: "fixed" as const, fixedAmount: "25000.00", sequence: 40, isActive: true },
    { name: "Director Performance Bonus", code: "PERF_BONUS", category: "allowance" as const, computationType: "percentage" as const, percentage: "10.0000", percentageBase: "BASIC", sequence: 50, isActive: true },
    { name: "Executive Gross Salary", code: "GROSS_EXEC", category: "gross" as const, computationType: "formula" as const, formula: "BASIC + HRA + DA + EXEC_ALLOW + PERF_BONUS", sequence: 100, isActive: true },
    { name: "Executive TDS Withholding", code: "TDS_EXEC", category: "deduction" as const, computationType: "percentage" as const, percentage: "12.0000", percentageBase: "GROSS_EXEC", sequence: 140, isActive: true },
    { name: "Total Executive Deductions", code: "DEDUCT_EXEC", category: "deduction" as const, computationType: "formula" as const, formula: "PF + PT + TDS_EXEC", sequence: 190, isActive: true },
    { name: "Executive Net Salary", code: "NET_EXEC", category: "net" as const, computationType: "formula" as const, formula: "GROSS_EXEC - DEDUCT_EXEC", sequence: 200, isActive: true },

    // Professional Contractor Rules
    { name: "Consulting Gross Fee", code: "GROSS_CONSULT", category: "gross" as const, computationType: "formula" as const, formula: "BASIC", sequence: 100, isActive: true },
    { name: "Professional TDS (194J)", code: "TDS_CONSULT", category: "deduction" as const, computationType: "percentage" as const, percentage: "10.0000", percentageBase: "GROSS_CONSULT", sequence: 140, isActive: true },
    { name: "Total Consulting Deductions", code: "DEDUCT_CONSULT", category: "deduction" as const, computationType: "formula" as const, formula: "TDS_CONSULT", sequence: 190, isActive: true },
    { name: "Consulting Net Payable", code: "NET_CONSULT", category: "net" as const, computationType: "formula" as const, formula: "GROSS_CONSULT - DEDUCT_CONSULT", sequence: 200, isActive: true },
  ];

  const createdRules = await db.insert(salaryRules).values(rulesData).returning();
  const ruleMap = new Map(createdRules.map((r) => [r.code, r]));

  // Structure 1: Standard Corporate Structure
  const [standardStructure] = await db
    .insert(salaryStructures)
    .values({
      name: "Standard Corporate Structure (Full Package)",
      code: "CORP_STANDARD",
      description: "Comprehensive package: Basic, HRA (50%), DA (10%), Special Allowance, PF (12%), PT (₹200), and TDS (5%).",
      isActive: true,
    })
    .returning();

  // Structure 2: Executive Leadership Structure
  const [execStructure] = await db
    .insert(salaryStructures)
    .values({
      name: "Executive & Senior Leadership Structure",
      code: "CORP_EXEC",
      description: "Leadership package: Basic, HRA (50%), DA (10%), Executive Allowance (₹25k), Performance Bonus (10%), PF, PT, and TDS (12%).",
      isActive: true,
    })
    .returning();

  // Structure 3: Professional Consultant Structure
  const [consultStructure] = await db
    .insert(salaryStructures)
    .values({
      name: "Professional Retainer & Consultant Structure",
      code: "CORP_CONSULT",
      description: "Fixed-term retainer structure: Retainer Fee with statutory Section 194J TDS (10%) withholding.",
      isActive: true,
    })
    .returning();

  // Link rules to Structure 1
  const standardRuleCodes = ["BASIC", "HRA", "DA", "SPECIAL", "GROSS", "PF", "PT", "TDS", "DEDUCTIONS", "NET"];
  const standardLinks = standardRuleCodes.map((code) => ({
    salaryStructureId: standardStructure.id,
    salaryRuleId: ruleMap.get(code)!.id,
    sequence: ruleMap.get(code)!.sequence,
    isActive: true,
  }));

  // Link rules to Structure 2
  const execRuleCodes = ["BASIC", "HRA", "DA", "EXEC_ALLOW", "PERF_BONUS", "GROSS_EXEC", "PF", "PT", "TDS_EXEC", "DEDUCT_EXEC", "NET_EXEC"];
  const execLinks = execRuleCodes.map((code) => ({
    salaryStructureId: execStructure.id,
    salaryRuleId: ruleMap.get(code)!.id,
    sequence: ruleMap.get(code)!.sequence,
    isActive: true,
  }));

  // Link rules to Structure 3
  const consultRuleCodes = ["BASIC", "GROSS_CONSULT", "TDS_CONSULT", "DEDUCT_CONSULT", "NET_CONSULT"];
  const consultLinks = consultRuleCodes.map((code) => ({
    salaryStructureId: consultStructure.id,
    salaryRuleId: ruleMap.get(code)!.id,
    sequence: ruleMap.get(code)!.sequence,
    isActive: true,
  }));

  await db.insert(salaryStructureRules).values([...standardLinks, ...execLinks, ...consultLinks]);

  // Structure-to-rules map for fast payroll computation
  const structureRulesCache = new Map<string, SalaryRule[]>([
    [standardStructure.id, standardRuleCodes.map((c) => ruleMap.get(c)!)],
    [execStructure.id, execRuleCodes.map((c) => ruleMap.get(c)!)],
    [consultStructure.id, consultRuleCodes.map((c) => ruleMap.get(c)!)],
  ]);

  console.log("✓ 3 Salary Structures established with rule links.\n");

  // ============================================================================
  // 9. EMPLOYMENT CONTRACTS (Active, Expiring in 15-50 days, Historical, Draft)
  // ============================================================================
  console.log("📄 Seeding 245+ Diverse Employment Contracts...");

  const allContractsToInsert = [];

  // 1. Primary active contracts for all 200 employees
  for (let i = 0; i < createdEmployees.length; i++) {
    const emp = createdEmployees[i];
    const wage = wageByEmployeeIndex.get(i) || 85000.0;

    // Pick structure: Executives get CORP_EXEC, Contractors get CORP_CONSULT, rest get CORP_STANDARD
    const structure =
      i < 3 || emp.departmentId === deptMap.get("EXEC")?.id
        ? execStructure
        : emp.employeeType === "contract"
        ? consultStructure
        : standardStructure;

    // Check if this employee should have an expiring contract (employees 35 to 49)
    // System date is 2026-09-05. Expiring dates between 2026-09-20 and 2026-10-31
    const isExpiringSoon = i >= 35 && i <= 49;
    const expiringEndDates = [
      "2026-09-20", "2026-09-25", "2026-09-30", "2026-10-05", "2026-10-10",
      "2026-10-15", "2026-10-20", "2026-10-25", "2026-10-31", "2026-10-18",
      "2026-09-28", "2026-10-02", "2026-10-08", "2026-10-14", "2026-10-22",
    ];

    const contractNumber = `CON-2025-${String(i + 1).padStart(4, "0")}`;
    const startDate = i < 25 ? "2025-01-01" : (emp.joiningDate || "2024-01-01");
    const endDate = isExpiringSoon ? expiringEndDates[i - 35] : null;

    allContractsToInsert.push({
      employeeId: emp.id,
      contractNumber,
      startDate,
      endDate,
      departmentId: emp.departmentId,
      jobPositionId: emp.jobPositionId,
      workingScheduleId: emp.workingScheduleId,
      salaryStructureId: structure.id,
      wage: wage.toFixed(2),
      currency: "INR",
      status: "active" as const,
    });
  }

  // 2. Historical sequential contracts for first 25 employees (expired prior contract)
  for (let i = 0; i < 25; i++) {
    const emp = createdEmployees[i];
    const currentWage = wageByEmployeeIndex.get(i) || 100000;
    const historicalWage = Math.round((currentWage * 0.78) / 1000) * 1000;

    allContractsToInsert.push({
      employeeId: emp.id,
      contractNumber: `CON-2023-${String(i + 1).padStart(4, "0")}`,
      startDate: emp.joiningDate || "2023-01-15",
      endDate: "2024-12-31",
      departmentId: emp.departmentId,
      jobPositionId: emp.jobPositionId,
      workingScheduleId: emp.workingScheduleId,
      salaryStructureId: standardStructure.id,
      wage: historicalWage.toFixed(2),
      currency: "INR",
      status: "expired" as const,
    });
  }

  // 3. Draft contracts for upcoming recruits / promotions (employees 180 to 186)
  for (let i = 180; i < 187; i++) {
    const emp = createdEmployees[i];
    const proposedWage = (wageByEmployeeIndex.get(i) || 80000) + 15000;

    allContractsToInsert.push({
      employeeId: emp.id,
      contractNumber: `CON-2026-DRAFT-${String(i - 179).padStart(2, "0")}`,
      startDate: "2026-10-01",
      endDate: "2027-09-30",
      departmentId: emp.departmentId,
      jobPositionId: emp.jobPositionId,
      workingScheduleId: emp.workingScheduleId,
      salaryStructureId: standardStructure.id,
      wage: proposedWage.toFixed(2),
      currency: "INR",
      status: "draft" as const,
    });
  }

  // 4. Terminated contracts (employees 196 to 199)
  for (let i = 196; i < 200; i++) {
    const emp = createdEmployees[i];
    allContractsToInsert.push({
      employeeId: emp.id,
      contractNumber: `CON-2024-TERM-${String(i - 195).padStart(2, "0")}`,
      startDate: "2024-01-15",
      endDate: "2025-10-31",
      departmentId: emp.departmentId,
      jobPositionId: emp.jobPositionId,
      workingScheduleId: emp.workingScheduleId,
      salaryStructureId: standardStructure.id,
      wage: "65000.00",
      currency: "INR",
      status: "terminated" as const,
    });
  }

  const createdContracts = await insertInBatchesReturning<any, any>(contracts, allContractsToInsert, 50);
  console.log(`✓ Seeded ${createdContracts.length} employment contracts (Active, Expiring Soon, Historical, Draft, Terminated).\n`);

  // Build active contract lookup for each employee
  const activeContractMap = new Map<string, any>();
  for (const c of createdContracts) {
    if (c.status === "active") {
      activeContractMap.set(c.employeeId, c);
    }
  }

  // ============================================================================
  // 10. TIME OFF TYPES, GRADUATED ALLOCATIONS & REALISTIC REQUESTS
  // ============================================================================
  console.log("🏖️  Seeding Time Off Types & Graduated Allocations for 200 Employees...");
  const leaveTypesData = [
    { name: "Paid Time Off (Annual Vacation)", code: "PTO", unit: "days" as const, requiresAllocation: true, approvalMode: "manager_and_hr" as const, isPaid: true, isActive: true },
    { name: "Sick & Medical Leave", code: "SICK", unit: "days" as const, requiresAllocation: true, approvalMode: "manager" as const, isPaid: true, isActive: true },
    { name: "Casual & Emergency Leave", code: "CASUAL", unit: "days" as const, requiresAllocation: true, approvalMode: "manager" as const, isPaid: true, isActive: true },
    { name: "Compensatory Off (Weekend Deployment)", code: "COMP_OFF", unit: "days" as const, requiresAllocation: true, approvalMode: "manager" as const, isPaid: true, isActive: true },
    { name: "Leave Without Pay (LWP)", code: "UNPAID", unit: "days" as const, requiresAllocation: false, approvalMode: "hr" as const, isPaid: false, isActive: true },
  ];

  const createdLeaveTypes = await db.insert(timeOffTypes).values(leaveTypesData).returning();
  const leaveTypeMap = new Map(createdLeaveTypes.map((lt) => [lt.code, lt]));

  const allocationsToInsert = [];
  const hrUserId = userRecordMap.get("hr.manager@peoplepay360.com");

  // Graduated allocations based on seniority and role
  for (let i = 0; i < createdEmployees.length; i++) {
    const emp = createdEmployees[i];
    const wage = wageByEmployeeIndex.get(i) || 80000;

    let ptoAmount = "20.00";
    let sickAmount = "10.00";
    let casualAmount = "7.00";

    if (wage >= 180000 || i < 10) {
      ptoAmount = "28.00";
      sickAmount = "14.00";
      casualAmount = "10.00";
    } else if (wage >= 120000) {
      ptoAmount = "24.00";
      sickAmount = "12.00";
      casualAmount = "8.00";
    } else if (emp.employeeType === "intern") {
      ptoAmount = "12.00";
      sickAmount = "6.00";
      casualAmount = "4.00";
    }

    allocationsToInsert.push(
      {
        employeeId: emp.id,
        timeOffTypeId: leaveTypeMap.get("PTO")!.id,
        allocatedAmount: ptoAmount,
        validFrom: "2026-01-01",
        validTo: "2026-12-31",
        status: "approved" as const,
        approvedBy: hrUserId,
        approvedAt: new Date("2026-01-02T09:30:00"),
      },
      {
        employeeId: emp.id,
        timeOffTypeId: leaveTypeMap.get("SICK")!.id,
        allocatedAmount: sickAmount,
        validFrom: "2026-01-01",
        validTo: "2026-12-31",
        status: "approved" as const,
        approvedBy: hrUserId,
        approvedAt: new Date("2026-01-02T09:30:00"),
      },
      {
        employeeId: emp.id,
        timeOffTypeId: leaveTypeMap.get("CASUAL")!.id,
        allocatedAmount: casualAmount,
        validFrom: "2026-01-01",
        validTo: "2026-12-31",
        status: "approved" as const,
        approvedBy: hrUserId,
        approvedAt: new Date("2026-01-02T09:30:00"),
      }
    );

    // Give 25 engineers / ops staff earned Compensatory Off
    if (i % 8 === 0) {
      allocationsToInsert.push({
        employeeId: emp.id,
        timeOffTypeId: leaveTypeMap.get("COMP_OFF")!.id,
        allocatedAmount: i % 16 === 0 ? "2.00" : "1.00",
        validFrom: "2026-01-01",
        validTo: "2026-12-31",
        status: "approved" as const,
        approvedBy: hrUserId,
        approvedAt: new Date("2026-03-01T10:00:00"),
      });
    }
  }

  await insertInBatches(timeOffAllocations, allocationsToInsert, 100);
  console.log(`✓ Seeded ${allocationsToInsert.length} graduated leave allocations.\n`);

  // Rich, realistic Leave Requests (120+ requests across diverse dates and authentic reasons)
  console.log("📝 Seeding Authentic Time Off Requests (120+ records)...");
  const authenticReasons = [
    "Attending sister's wedding ceremony and family celebrations in Jaipur",
    "Acute viral bronchitis and fever - physician recommended 3 days complete bed rest",
    "Annual family summer vacation and road trip to Himachal Pradesh",
    "Dental wisdom tooth extraction surgery and subsequent recovery",
    "Paternity leave to welcome and care for newborn daughter",
    "Home apartment lease transfer and relocation moving day",
    "Attending React Summit India 2026 conference in Bengaluru",
    "Daughter's elementary school admission interview and orientation day",
    "Emergency hospitalization and medical tests for elderly parent",
    "Festive family gathering for Navratri & Diwali celebrations in native town",
    "Sitting for AWS Certified Solutions Architect Professional examination",
    "Personal wellness, mindfulness retreat, and mental health rejuvenation",
    "Severe allergic conjunctivitis - ophthalmologist advised avoiding screens",
    "Attending college alumni reunion and guest speaker panel in Pune",
  ];

  const sampleRequests = [];
  const requestDates = [
    { start: "2026-07-06", end: "2026-07-08", duration: "3.00", type: "PTO" },
    { start: "2026-07-15", end: "2026-07-16", duration: "2.00", type: "CASUAL" },
    { start: "2026-07-22", end: "2026-07-22", duration: "1.00", type: "SICK" },
    { start: "2026-08-03", end: "2026-08-04", duration: "2.00", type: "PTO" },
    { start: "2026-08-11", end: "2026-08-11", duration: "1.00", type: "SICK" },
    { start: "2026-08-18", end: "2026-08-20", duration: "3.00", type: "PTO" },
    { start: "2026-08-27", end: "2026-08-28", duration: "2.00", type: "CASUAL" },
    { start: "2026-09-08", end: "2026-09-10", duration: "3.00", type: "PTO" },
    { start: "2026-09-15", end: "2026-09-16", duration: "2.00", type: "CASUAL" },
    { start: "2026-09-22", end: "2026-09-22", duration: "1.00", type: "SICK" },
    { start: "2026-10-05", end: "2026-10-09", duration: "5.00", type: "PTO" },
    { start: "2026-10-19", end: "2026-10-20", duration: "2.00", type: "CASUAL" },
    { start: "2026-11-02", end: "2026-11-04", duration: "3.00", type: "PTO" },
  ];

  for (let i = 0; i < 120; i++) {
    const emp = createdEmployees[i % createdEmployees.length];
    const dateSpec = requestDates[i % requestDates.length];
    const reason = authenticReasons[i % authenticReasons.length];

    // Varied statuses: 75 approved, 25 pending, 12 refused, 8 cancelled
    const isPending = i % 5 === 1;
    const isRefused = i % 10 === 7;
    const isCancelled = i % 15 === 14;
    const isApproved = !isPending && !isRefused && !isCancelled;

    const status = isPending ? "pending" : isRefused ? "refused" : isCancelled ? "cancelled" : "approved";

    sampleRequests.push({
      employeeId: emp.id,
      timeOffTypeId: leaveTypeMap.get(dateSpec.type)!.id,
      startDate: dateSpec.start,
      endDate: dateSpec.end,
      duration: dateSpec.duration,
      reason,
      status: status as any,
      approvedBy: isApproved ? hrUserId : undefined,
      approvedAt: isApproved ? new Date("2026-07-01T14:00:00") : undefined,
      refusalReason: isRefused ? "High-priority client go-live sprint window; department coverage required above 75%." : undefined,
    });
  }

  await insertInBatches(timeOffRequests, sampleRequests, 50);
  console.log(`✓ Seeded ${sampleRequests.length} authentic leave requests with full lifecycle states.\n`);

  // ============================================================================
  // 11. ATTENDANCE (3,200 records) & ATTENDANCE CORRECTIONS (12 records)
  // ============================================================================
  console.log("⏰ Seeding 16 Working Days of Biometric Attendance for 200 Employees (3,200 records)...");

  const workingDates = [
    "2026-08-17", "2026-08-18", "2026-08-19", "2026-08-20", "2026-08-21",
    "2026-08-24", "2026-08-25", "2026-08-26", "2026-08-27", "2026-08-28",
    "2026-08-31", "2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04",
    "2026-09-05", // Today's date!
  ];

  const transitDelayNotes = [
    "Severe monsoon traffic bottleneck on SG Highway",
    "Metro signal malfunction delay at Central Terminal",
    "Flat motorcycle tyre on outer ring road",
    "Scheduled morning diagnostic lab blood test",
  ];

  const overtimeNotes = [
    "Sprint 24 production deployment and smoke testing",
    "Client P1 critical incident resolution and root cause audit",
    "Quarter-end database migration cutover and verification",
    "Month-end payroll reconciliation and statutory filing preparation",
  ];

  const attendanceRecords = [];

  for (let i = 0; i < createdEmployees.length; i++) {
    const emp = createdEmployees[i];
    for (let d = 0; d < workingDates.length; d++) {
      const dStr = workingDates[d];

      // Realistic distributions: 82% normal on-time, 9% late, 6% overtime, 2% half-day, 1% absent
      const randSeed = (i * 17 + d * 31) % 100;
      const isAbsent = randSeed === 99;
      const isHalfDay = randSeed >= 96 && randSeed <= 98;
      const isLate = randSeed >= 87 && randSeed <= 95;
      const isOvertime = randSeed >= 81 && randSeed <= 86;

      if (isAbsent) {
        attendanceRecords.push({
          employeeId: emp.id,
          attendanceDate: dStr,
          checkIn: null,
          checkOut: null,
          workedMinutes: 0,
          overtimeMinutes: 0,
          status: "absent" as const,
          isManuallyEdited: false,
          notes: "Unscheduled medical absence - doctor certificate submitted",
        });
        continue;
      }

      if (isHalfDay) {
        const checkIn = new Date(`${dStr}T09:02:15+05:30`);
        const checkOut = new Date(`${dStr}T13:05:40+05:30`);
        attendanceRecords.push({
          employeeId: emp.id,
          attendanceDate: dStr,
          checkIn,
          checkOut,
          workedMinutes: 240,
          overtimeMinutes: 0,
          status: "present" as const,
          isManuallyEdited: false,
          notes: "Approved half-day afternoon personal leave",
        });
        continue;
      }

      // Punch jitter in seconds and minutes
      const inMin = isLate ? 25 + ((i + d) % 20) : (i * 2 + d * 3) % 8;
      const inSec = (i * 7 + d * 13) % 59;
      const checkInHourStr = isLate ? "09" : (inMin > 50 ? "08" : "09");
      const checkInMinStr = isLate ? String(inMin).padStart(2, "0") : String((inMin + 55) % 60).padStart(2, "0");

      const outHour = isOvertime ? 19 + ((i + d) % 2) : 18;
      const outMin = isOvertime ? 30 + ((i * 3 + d * 5) % 25) : 5 + ((i * 4 + d * 2) % 15);
      const outSec = (i * 11 + d * 19) % 59;

      const checkIn = new Date(`${dStr}T${checkInHourStr}:${checkInMinStr}:${String(inSec).padStart(2, "0")}+05:30`);
      const checkOut = new Date(`${dStr}T${String(outHour).padStart(2, "0")}:${String(outMin).padStart(2, "0")}:${String(outSec).padStart(2, "0")}+05:30`);

      const overtimeMins = isOvertime ? 90 + ((i + d) % 4) * 30 : 0;
      const workedMins = isOvertime ? 480 + overtimeMins : isLate ? 440 : 480 + ((i + d) % 15);
      const status = isOvertime ? "overtime" : isLate ? "late" : "present";
      const notes = isOvertime
        ? overtimeNotes[(i + d) % overtimeNotes.length]
        : isLate
        ? transitDelayNotes[(i + d) % transitDelayNotes.length]
        : null;

      attendanceRecords.push({
        employeeId: emp.id,
        attendanceDate: dStr,
        checkIn,
        checkOut,
        workedMinutes: workedMins,
        overtimeMinutes: overtimeMins,
        status: status as any,
        isManuallyEdited: false,
        notes,
      });
    }
  }

  const insertedAttendances = await insertInBatchesReturning<any, any>(attendance, attendanceRecords, 100);
  console.log(`✓ Seeded ${insertedAttendances.length} authentic attendance records.\n`);

  // Attendance Corrections (12 records)
  console.log("📝 Seeding Attendance Corrections (Pending & Approved)...");
  const adminUser = userRecordMap.get("admin@peoplepay360.com")!;
  const correctionsToInsert = [];

  for (let i = 0; i < 12; i++) {
    const att = insertedAttendances[i * 200];
    const isApproved = i % 2 === 0;
    correctionsToInsert.push({
      attendanceId: att.id,
      requestedBy: adminUser,
      approvedBy: isApproved ? hrUserId : undefined,
      oldCheckIn: att.checkIn,
      oldCheckOut: att.checkOut,
      newCheckIn: new Date(`${att.attendanceDate}T09:00:00+05:30`),
      newCheckOut: new Date(`${att.attendanceDate}T18:00:00+05:30`),
      reason: i % 2 === 0 ? "RFID badge reader at North turnstile failed to capture departure punch." : "Forgot badge at home; attended on-site meetings all day.",
      status: isApproved ? "approved" : "pending",
    });
  }
  await insertInBatches(attendanceCorrections, correctionsToInsert, 20);
  console.log(`✓ Seeded ${correctionsToInsert.length} attendance correction records.\n`);

  // ============================================================================
  // 12. PAYRUNS & 600 ITEMISED PAYSLIPS (July Paid, August Paid, Sept Validated)
  // ============================================================================
  console.log("💵 Seeding 3 Monthly Payruns (200 Payslips Each = 600 Payslips Total)...");

  // Payrun 1: July 2026 (PAID)
  const [julyPayrun] = await db
    .insert(payruns)
    .values({
      name: "Monthly Payrun - July 2026",
      salaryStructureId: standardStructure.id,
      periodStart: "2026-07-01",
      periodEnd: "2026-07-31",
      status: "paid",
      createdBy: adminUser,
      computedAt: new Date("2026-07-28T10:00:00"),
      validatedAt: new Date("2026-07-29T14:30:00"),
      paidAt: new Date("2026-07-31T16:00:00"),
    })
    .returning();

  // Payrun 2: August 2026 (PAID)
  const [augustPayrun] = await db
    .insert(payruns)
    .values({
      name: "Monthly Payrun - August 2026",
      salaryStructureId: standardStructure.id,
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      status: "paid",
      createdBy: adminUser,
      computedAt: new Date("2026-08-28T10:00:00"),
      validatedAt: new Date("2026-08-29T14:30:00"),
      paidAt: new Date("2026-08-31T16:00:00"),
    })
    .returning();

  // Payrun 3: September 2026 (VALIDATED - Current Month)
  const [septPayrun] = await db
    .insert(payruns)
    .values({
      name: "Monthly Payrun - September 2026",
      salaryStructureId: standardStructure.id,
      periodStart: "2026-09-01",
      periodEnd: "2026-09-30",
      status: "validated",
      createdBy: adminUser,
      computedAt: new Date("2026-09-03T09:15:00"),
      validatedAt: new Date("2026-09-04T11:00:00"),
    })
    .returning();

  console.log(`✓ Payruns created: "${julyPayrun.name}" (Paid), "${augustPayrun.name}" (Paid), and "${septPayrun.name}" (Validated).\n`);

  // Authentic warning reasons
  const warningMessages = [
    { code: "ATTENDANCE_OVERTIME", severity: "info" as const, message: "Biometric overtime hours calculated and verified against project delivery records." },
    { code: "TAX_EXEMPTION_DOCS_PENDING", severity: "warning" as const, message: "Section 80C investment proof verification pending submission from employee." },
    { code: "UNPAID_LEAVE_DEDUCTED", severity: "warning" as const, message: "Unapproved absence deducted as Leave Without Pay (LWP) following HR review." },
    { code: "STATUTORY_EPF_MATCHED", severity: "info" as const, message: "Statutory EPF employee and employer contribution matched at 12% ceiling." },
    { code: "ANNUAL_INCREMENT_APPLIED", severity: "info" as const, message: "Compensation revised per annual performance review milestone." },
  ];

  // Dynamic salary engine execution for each payrun
  async function generatePayrunSlips(
    payrun: typeof julyPayrun,
    targetStatus: "paid" | "validated",
    prefix: string,
    standardDaysInMonth: number
  ) {
    console.log(`   ⚙️  Calculating 200 payslips for ${payrun.name}...`);
    const slipsToInsert = [];
    const evaluationResults = [];

    for (let i = 0; i < createdEmployees.length; i++) {
      const emp = createdEmployees[i];
      const contract = activeContractMap.get(emp.id) || createdContracts.find((c) => c.employeeId === emp.id);

      // Realistic varied attendance and leave numbers per employee
      const hasUnpaidLeave = i % 14 === 3;
      const unpaidDays = hasUnpaidLeave ? (i % 28 === 3 ? 2 : 1) : 0;
      const hasPaidLeave = i % 8 === 2;
      const paidDays = hasPaidLeave ? (i % 16 === 2 ? 2 : 1) : 0;
      const hasOvertime = (i + standardDaysInMonth) % 6 === 0;
      const overtimeHours = hasOvertime ? 4.0 + ((i * 3) % 12) : 0;

      const workedDays = standardDaysInMonth - unpaidDays;
      const workedHours = workedDays * 8 + overtimeHours;

      const payrollContext = {
        employee: emp,
        contract,
        period: {
          start: payrun.periodStart,
          end: payrun.periodEnd,
        },
        attendance: {
          workedDays,
          workedHours,
          overtimeHours,
        },
        leave: {
          paidDays,
          unpaidDays,
        },
        results: {},
      };

      // Retrieve exact salary rules for this contract's structure
      const rulesForStructure = structureRulesCache.get(contract.salaryStructureId) || structureRulesCache.get(standardStructure.id)!;
      const result = executeSalaryEngine(rulesForStructure, payrollContext);
      const payslipNumber = `PS-${prefix}-${String(i + 1).padStart(4, "0")}`;

      slipsToInsert.push({
        payslipNumber,
        payrunId: payrun.id,
        employeeId: emp.id,
        contractId: contract.id,
        salaryStructureId: contract.salaryStructureId,
        periodStart: payrun.periodStart,
        periodEnd: payrun.periodEnd,
        workedDays: workedDays.toFixed(2),
        workedHours: workedHours.toFixed(2),
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

    const insertedSlips = await insertInBatchesReturning<any, any>(payslips, slipsToInsert, 50);

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

      // Add realistic warnings for employees with overtime, unpaid leave, or tax docs
      if (i % 7 === 0) {
        const warnPick = warningMessages[i % warningMessages.length];
        warningsToInsert.push({
          payslipId: slip.id,
          code: warnPick.code,
          severity: warnPick.severity,
          message: warnPick.message,
          resolved: targetStatus === "paid",
        });
      }
    }

    await insertInBatches(payslipLines, allLinesToInsert, 100);
    if (warningsToInsert.length > 0) {
      await insertInBatches(payslipWarnings, warningsToInsert, 50);
    }

    console.log(`   ✓ ${insertedSlips.length} payslips and ${allLinesToInsert.length} line items stored.`);
  }

  await generatePayrunSlips(julyPayrun, "paid", "2026-07", 22);
  await generatePayrunSlips(augustPayrun, "paid", "2026-08", 21);
  await generatePayrunSlips(septPayrun, "validated", "2026-09", 22);

  // ============================================================================
  // SUMMARY REPORT
  // ============================================================================
  console.log("\n══════════════════════════════════════════════════════════════════════");
  console.log("🎉 PeoplePay360 Database Seeding Completed with Full Variety Data!");
  console.log("══════════════════════════════════════════════════════════════════════");
  console.log("📊 Summary of Seeded Operational Records:");
  console.log(`   • Working Schedules:         3 (Standard 40h, Flexible Shift, Ops Shift)`);
  console.log(`   • Departments:               ${depts.length} (EXEC, HR, FIN, ENG, PROD, SALES, OPS, DATA)`);
  console.log(`   • Job Positions:             ${jobs.length} (Executive to Intern)`);
  console.log(`   • Employees:                 ${createdEmployees.length} (EMP-0001 to EMP-0200)`);
  console.log(`   • Career History Events:     ${historyEvents.length} (Promotions, Transfers, Band Revisions)`);
  console.log(`   • Salary Structures:         3 (Corporate Standard, Executive Leadership, Consultant Retainer)`);
  console.log(`   • Salary Rules:              ${createdRules.length}`);
  console.log(`   • Employment Contracts:      ${createdContracts.length} (Active, Expiring Soon, Historical, Draft)`);
  console.log(`   • Time Off Types:            ${createdLeaveTypes.length} (PTO, SICK, CASUAL, COMP_OFF, UNPAID)`);
  console.log(`   • Graduated Leave Balances:  ${allocationsToInsert.length} (Graduated by seniority)`);
  console.log(`   • Time Off Requests:         ${sampleRequests.length} (Approved, Pending, Refused, Cancelled)`);
  console.log(`   • Biometric Attendance Logs: ${insertedAttendances.length} (Includes today's live check-ins)`);
  console.log(`   • Attendance Corrections:    ${correctionsToInsert.length} (Pending & Approved)`);
  console.log(`   • Monthly Payruns:           3 (July Paid, August Paid, September Validated)`);
  console.log(`   • Itemized Payslips:         600 (200 per payrun with full attendance & rule calculations)`);
  console.log("──────────────────────────────────────────────────────────────────────");
  console.log("🔑 Default Test Log-in Accounts (Password: Password123!):");
  console.log("   • Admin:               admin@peoplepay360.com");
  console.log("   • HR Manager:          hr.manager@peoplepay360.com");
  console.log("   • Payroll Manager:     payroll.manager@peoplepay360.com");
  console.log("   • Payroll Officer:     payroll.officer@peoplepay360.com");
  console.log("   • Lead Architect:      marcus.vance@peoplepay360.com");
  console.log("   • Senior Engineer:     alex.morgan@peoplepay360.com");
  console.log("   • Personal User:       uvpatel7271@gmail.com / 24cp020@bvmengineering.ac.in");
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
