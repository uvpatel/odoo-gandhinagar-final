CREATE TYPE "user_role" AS ENUM('employee', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin');--> statement-breakpoint
CREATE TYPE "employee_status" AS ENUM('draft', 'active', 'inactive', 'terminated');--> statement-breakpoint
CREATE TYPE "employee_type" AS ENUM('full_time', 'part_time', 'contract', 'intern');--> statement-breakpoint
CREATE TYPE "contract_status" AS ENUM('draft', 'active', 'expired', 'terminated', 'cancelled');--> statement-breakpoint
CREATE TYPE "attendance_status" AS ENUM('present', 'late', 'absent', 'overtime', 'incomplete');--> statement-breakpoint
CREATE TYPE "approval_mode" AS ENUM('none', 'manager', 'hr', 'manager_and_hr');--> statement-breakpoint
CREATE TYPE "leave_unit" AS ENUM('days', 'hours');--> statement-breakpoint
CREATE TYPE "allocation_status" AS ENUM('draft', 'pending', 'approved', 'refused', 'expired');--> statement-breakpoint
CREATE TYPE "time_off_request_status" AS ENUM('draft', 'pending', 'approved', 'refused', 'cancelled');--> statement-breakpoint
CREATE TYPE "salary_computation_type" AS ENUM('fixed', 'percentage', 'formula');--> statement-breakpoint
CREATE TYPE "salary_rule_category" AS ENUM('basic', 'allowance', 'gross', 'deduction', 'contribution', 'net');--> statement-breakpoint
CREATE TYPE "payrun_status" AS ENUM('draft', 'computed', 'validated', 'paid', 'cancelled');--> statement-breakpoint
CREATE TYPE "payslip_status" AS ENUM('draft', 'computed', 'validated', 'paid', 'cancelled');--> statement-breakpoint
CREATE TYPE "warning_severity" AS ENUM('info', 'warning', 'error');--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean NOT NULL,
	"image" text,
	"role" "user_role" DEFAULT 'employee'::"user_role" NOT NULL,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(100) NOT NULL,
	"code" varchar(30) NOT NULL UNIQUE,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"title" varchar(120) NOT NULL,
	"code" varchar(30) NOT NULL UNIQUE,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "working_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(120) NOT NULL,
	"schedule_type" varchar(30) DEFAULT 'standard' NOT NULL,
	"timezone" varchar(100) DEFAULT 'Asia/Kolkata' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "working_schedule_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"schedule_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"break_minutes" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"employee_number" varchar(30) NOT NULL UNIQUE,
	"user_id" text UNIQUE,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"work_email" varchar(255) UNIQUE,
	"phone" varchar(30),
	"department_id" uuid,
	"job_position_id" uuid,
	"manager_id" uuid,
	"working_schedule_id" uuid,
	"employee_type" "employee_type" DEFAULT 'full_time'::"employee_type" NOT NULL,
	"status" "employee_status" DEFAULT 'draft'::"employee_status" NOT NULL,
	"joining_date" date,
	"bank_account_number" varchar(100),
	"bank_name" varchar(120),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"employee_id" uuid NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"effective_date" date NOT NULL,
	"previous_department_id" uuid,
	"new_department_id" uuid,
	"previous_job_position_id" uuid,
	"new_job_position_id" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"employee_id" uuid NOT NULL,
	"contract_number" varchar(50) NOT NULL UNIQUE,
	"start_date" date NOT NULL,
	"end_date" date,
	"department_id" uuid,
	"job_position_id" uuid,
	"working_schedule_id" uuid,
	"salary_structure_id" uuid,
	"wage" numeric(14,2) NOT NULL,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"status" "contract_status" DEFAULT 'draft'::"contract_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"employee_id" uuid NOT NULL,
	"attendance_date" date NOT NULL,
	"check_in" timestamp,
	"check_out" timestamp,
	"worked_minutes" integer DEFAULT 0 NOT NULL,
	"overtime_minutes" integer DEFAULT 0 NOT NULL,
	"status" "attendance_status",
	"is_manually_edited" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_employee_id_attendance_date_unique" UNIQUE("employee_id","attendance_date")
);
--> statement-breakpoint
CREATE TABLE "attendance_corrections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"attendance_id" uuid NOT NULL,
	"requested_by" text NOT NULL,
	"approved_by" text,
	"old_check_in" timestamp,
	"old_check_out" timestamp,
	"new_check_in" timestamp,
	"new_check_out" timestamp,
	"reason" text NOT NULL,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_off_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(100) NOT NULL,
	"code" varchar(30) NOT NULL UNIQUE,
	"unit" "leave_unit" DEFAULT 'days'::"leave_unit" NOT NULL,
	"requires_allocation" boolean DEFAULT true NOT NULL,
	"approval_mode" "approval_mode" DEFAULT 'manager'::"approval_mode" NOT NULL,
	"is_paid" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_off_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"employee_id" uuid NOT NULL,
	"time_off_type_id" uuid NOT NULL,
	"allocated_amount" numeric(10,2) NOT NULL,
	"valid_from" date NOT NULL,
	"valid_to" date,
	"status" "allocation_status" DEFAULT 'draft'::"allocation_status" NOT NULL,
	"approved_by" text,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_off_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"employee_id" uuid NOT NULL,
	"time_off_type_id" uuid NOT NULL,
	"allocation_id" uuid,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"duration" numeric(10,2) NOT NULL,
	"reason" text,
	"status" "time_off_request_status" DEFAULT 'draft'::"time_off_request_status" NOT NULL,
	"approved_by" text,
	"approved_at" timestamp,
	"refusal_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salary_structures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(120) NOT NULL,
	"code" varchar(30) NOT NULL UNIQUE,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salary_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(120) NOT NULL,
	"code" varchar(30) NOT NULL UNIQUE,
	"category" "salary_rule_category" NOT NULL,
	"computation_type" "salary_computation_type" NOT NULL,
	"fixed_amount" numeric(14,2),
	"percentage" numeric(8,4),
	"percentage_base" varchar(100),
	"formula" text,
	"sequence" integer DEFAULT 10 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salary_structure_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"salary_structure_id" uuid NOT NULL,
	"salary_rule_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "salary_structure_rules_salary_structure_id_salary_rule_id_unique" UNIQUE("salary_structure_id","salary_rule_id")
);
--> statement-breakpoint
CREATE TABLE "payruns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(150) NOT NULL,
	"salary_structure_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"status" "payrun_status" DEFAULT 'draft'::"payrun_status" NOT NULL,
	"created_by" text NOT NULL,
	"computed_at" timestamp,
	"validated_at" timestamp,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payslips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"payslip_number" varchar(50) NOT NULL UNIQUE,
	"payrun_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"contract_id" uuid NOT NULL,
	"salary_structure_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"worked_days" numeric(8,2) DEFAULT '0',
	"worked_hours" numeric(10,2) DEFAULT '0',
	"basic_amount" numeric(14,2) DEFAULT '0',
	"gross_amount" numeric(14,2) DEFAULT '0',
	"deduction_amount" numeric(14,2) DEFAULT '0',
	"net_amount" numeric(14,2) DEFAULT '0',
	"status" "payslip_status" DEFAULT 'draft'::"payslip_status" NOT NULL,
	"computed_at" timestamp,
	"validated_at" timestamp,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payslips_payrun_id_employee_id_unique" UNIQUE("payrun_id","employee_id")
);
--> statement-breakpoint
CREATE TABLE "payslip_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"payslip_id" uuid NOT NULL,
	"salary_rule_id" uuid,
	"rule_code" varchar(30) NOT NULL,
	"rule_name" varchar(120) NOT NULL,
	"category" "salary_rule_category" NOT NULL,
	"sequence" integer NOT NULL,
	"amount" numeric(14,2) NOT NULL,
	"quantity" numeric(12,4) DEFAULT '1' NOT NULL,
	"rate" numeric(12,4) DEFAULT '100' NOT NULL,
	"total" numeric(14,2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payslip_warnings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"payslip_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"severity" "warning_severity" NOT NULL,
	"message" text NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "employee_department_idx" ON "employees" ("department_id");--> statement-breakpoint
CREATE INDEX "employee_manager_idx" ON "employees" ("manager_id");--> statement-breakpoint
CREATE INDEX "employee_status_idx" ON "employees" ("status");--> statement-breakpoint
CREATE INDEX "contract_employee_idx" ON "contracts" ("employee_id");--> statement-breakpoint
CREATE INDEX "contract_start_date_idx" ON "contracts" ("start_date");--> statement-breakpoint
CREATE INDEX "contract_end_date_idx" ON "contracts" ("end_date");--> statement-breakpoint
CREATE INDEX "contract_status_idx" ON "contracts" ("status");--> statement-breakpoint
CREATE INDEX "attendance_employee_date_idx" ON "attendance" ("employee_id","attendance_date");--> statement-breakpoint
CREATE INDEX "allocation_employee_type_idx" ON "time_off_allocations" ("employee_id","time_off_type_id");--> statement-breakpoint
CREATE INDEX "time_off_employee_idx" ON "time_off_requests" ("employee_id");--> statement-breakpoint
CREATE INDEX "time_off_status_idx" ON "time_off_requests" ("status");--> statement-breakpoint
CREATE INDEX "time_off_dates_idx" ON "time_off_requests" ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "structure_rules_structure_idx" ON "salary_structure_rules" ("salary_structure_id");--> statement-breakpoint
CREATE INDEX "payrun_period_idx" ON "payruns" ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "payrun_status_idx" ON "payruns" ("status");--> statement-breakpoint
CREATE INDEX "payslip_payrun_idx" ON "payslips" ("payrun_id");--> statement-breakpoint
CREATE INDEX "payslip_employee_idx" ON "payslips" ("employee_id");--> statement-breakpoint
CREATE INDEX "payslip_employee_period_idx" ON "payslips" ("employee_id","period_start","period_end");--> statement-breakpoint
CREATE INDEX "payslip_lines_payslip_idx" ON "payslip_lines" ("payslip_id");--> statement-breakpoint
CREATE INDEX "payslip_lines_rule_idx" ON "payslip_lines" ("salary_rule_id");--> statement-breakpoint
CREATE INDEX "payslip_warnings_payslip_idx" ON "payslip_warnings" ("payslip_id");--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "working_schedule_lines" ADD CONSTRAINT "working_schedule_lines_schedule_id_working_schedules_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "working_schedules"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_departments_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id");--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_job_position_id_job_positions_id_fkey" FOREIGN KEY ("job_position_id") REFERENCES "job_positions"("id");--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_working_schedule_id_working_schedules_id_fkey" FOREIGN KEY ("working_schedule_id") REFERENCES "working_schedules"("id");--> statement-breakpoint
ALTER TABLE "employee_history" ADD CONSTRAINT "employee_history_employee_id_employees_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "employee_history" ADD CONSTRAINT "employee_history_previous_department_id_departments_id_fkey" FOREIGN KEY ("previous_department_id") REFERENCES "departments"("id");--> statement-breakpoint
ALTER TABLE "employee_history" ADD CONSTRAINT "employee_history_new_department_id_departments_id_fkey" FOREIGN KEY ("new_department_id") REFERENCES "departments"("id");--> statement-breakpoint
ALTER TABLE "employee_history" ADD CONSTRAINT "employee_history_previous_job_position_id_job_positions_id_fkey" FOREIGN KEY ("previous_job_position_id") REFERENCES "job_positions"("id");--> statement-breakpoint
ALTER TABLE "employee_history" ADD CONSTRAINT "employee_history_new_job_position_id_job_positions_id_fkey" FOREIGN KEY ("new_job_position_id") REFERENCES "job_positions"("id");--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_employee_id_employees_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id");--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_department_id_departments_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id");--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_job_position_id_job_positions_id_fkey" FOREIGN KEY ("job_position_id") REFERENCES "job_positions"("id");--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_working_schedule_id_working_schedules_id_fkey" FOREIGN KEY ("working_schedule_id") REFERENCES "working_schedules"("id");--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_employee_id_employees_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id");--> statement-breakpoint
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_attendance_id_attendance_id_fkey" FOREIGN KEY ("attendance_id") REFERENCES "attendance"("id");--> statement-breakpoint
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_requested_by_users_id_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_approved_by_users_id_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "time_off_allocations" ADD CONSTRAINT "time_off_allocations_employee_id_employees_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id");--> statement-breakpoint
ALTER TABLE "time_off_allocations" ADD CONSTRAINT "time_off_allocations_time_off_type_id_time_off_types_id_fkey" FOREIGN KEY ("time_off_type_id") REFERENCES "time_off_types"("id");--> statement-breakpoint
ALTER TABLE "time_off_allocations" ADD CONSTRAINT "time_off_allocations_approved_by_users_id_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_employee_id_employees_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id");--> statement-breakpoint
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_time_off_type_id_time_off_types_id_fkey" FOREIGN KEY ("time_off_type_id") REFERENCES "time_off_types"("id");--> statement-breakpoint
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_allocation_id_time_off_allocations_id_fkey" FOREIGN KEY ("allocation_id") REFERENCES "time_off_allocations"("id");--> statement-breakpoint
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_approved_by_users_id_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "salary_structure_rules" ADD CONSTRAINT "salary_structure_rules_Sj3X5u85ZqLH_fkey" FOREIGN KEY ("salary_structure_id") REFERENCES "salary_structures"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "salary_structure_rules" ADD CONSTRAINT "salary_structure_rules_salary_rule_id_salary_rules_id_fkey" FOREIGN KEY ("salary_rule_id") REFERENCES "salary_rules"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payruns" ADD CONSTRAINT "payruns_salary_structure_id_salary_structures_id_fkey" FOREIGN KEY ("salary_structure_id") REFERENCES "salary_structures"("id");--> statement-breakpoint
ALTER TABLE "payruns" ADD CONSTRAINT "payruns_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_payrun_id_payruns_id_fkey" FOREIGN KEY ("payrun_id") REFERENCES "payruns"("id");--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_employee_id_employees_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id");--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_contract_id_contracts_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id");--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_salary_structure_id_salary_structures_id_fkey" FOREIGN KEY ("salary_structure_id") REFERENCES "salary_structures"("id");--> statement-breakpoint
ALTER TABLE "payslip_lines" ADD CONSTRAINT "payslip_lines_payslip_id_payslips_id_fkey" FOREIGN KEY ("payslip_id") REFERENCES "payslips"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payslip_lines" ADD CONSTRAINT "payslip_lines_salary_rule_id_salary_rules_id_fkey" FOREIGN KEY ("salary_rule_id") REFERENCES "salary_rules"("id");--> statement-breakpoint
ALTER TABLE "payslip_warnings" ADD CONSTRAINT "payslip_warnings_payslip_id_payslips_id_fkey" FOREIGN KEY ("payslip_id") REFERENCES "payslips"("id") ON DELETE CASCADE;