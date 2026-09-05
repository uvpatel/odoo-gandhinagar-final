import React from "react";
import { useId } from "react";

export default function FeaturesSectionDemo() {
  return (
    <div className="py-20 lg:py-40">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10 md:gap-2 max-w-7xl mx-auto">
        {grid.map((feature, index) => (
          <div
            key={feature.title}
            className="relative bg-gradient-to-b dark:from-neutral-900 from-neutral-100 dark:to-neutral-950 to-white p-6 rounded-3xl overflow-hidden"
          >
            <Grid size={20} pattern={defaultPatterns[index % defaultPatterns.length]} />
            <p className="text-base font-bold text-neutral-800 dark:text-white relative z-20">
              {feature.title}
            </p>
            <p className="text-neutral-600 dark:text-neutral-400 mt-4 text-base font-normal relative z-20">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const grid = [
  {
    title: "Complete Employee Management",
    description:
      "Manage employee profiles, departments, job positions, contracts, salary information, and complete employment history from one place.",
  },
  {
    title: "Smart Attendance Tracking",
    description:
      "Track employee check-ins, check-outs, worked hours, overtime, attendance exceptions, and manual corrections.",
  },
  {
    title: "Time Off Management",
    description:
      "Handle leave requests, approvals, allocations, leave types, and employee balances through a structured approval workflow.",
  },
  {
    title: "Automated Payroll Processing",
    description:
      "Create payruns, select eligible employees, compute salaries, validate payroll, and track payment status efficiently.",
  },
  {
    title: "Flexible Salary Structures",
    description:
      "Configure reusable salary structures and ordered rules for basic pay, allowances, deductions, gross salary, and net salary.",
  },
  {
    title: "Payslips & Employee Delivery",
    description:
      "Generate professional payslip PDFs and securely distribute payslips to employees through bulk email delivery.",
  },
  {
    title: "Payroll Analytics",
    description:
      "Monitor payroll costs, salary trends, attendance insights, leave activity, and department-level expenses from interactive dashboards.",
  },
  {
    title: "Role-Based Access Control",
    description:
      "Secure HR and payroll operations with dedicated permissions for employees, HR managers, payroll users, payroll managers, and administrators.",
  },
];


const defaultPatterns = [
  [[7, 1], [8, 2], [9, 3], [7, 4], [10, 2]],
  [[8, 1], [7, 3], [10, 2], [9, 5], [8, 4]],
  [[9, 2], [8, 4], [7, 1], [10, 3], [9, 6]],
  [[7, 2], [8, 5], [9, 1], [10, 4], [7, 6]],
  [[8, 3], [9, 2], [7, 5], [10, 1], [8, 6]],
  [[10, 2], [7, 4], [8, 1], [9, 3], [10, 5]],
  [[7, 3], [9, 4], [8, 2], [10, 6], [7, 1]],
  [[8, 2], [10, 3], [9, 5], [7, 2], [8, 6]],
];

export const Grid = ({
  pattern,
  size,
}: {
  pattern?: number[][];
  size?: number;
}) => {
  const p = pattern ?? defaultPatterns[0];
  return (
    <div className="pointer-events-none absolute left-1/2 top-0  -ml-20 -mt-2 h-full w-full [mask-image:linear-gradient(white,transparent)]">
      <div className="absolute inset-0 bg-gradient-to-r  [mask-image:radial-gradient(farthest-side_at_top,white,transparent)] dark:from-zinc-900/30 from-zinc-100/30 to-zinc-300/30 dark:to-zinc-900/30 opacity-100">
        <GridPattern
          width={size ?? 20}
          height={size ?? 20}
          x="-12"
          y="4"
          squares={p}
          className="absolute inset-0 h-full w-full  mix-blend-overlay dark:fill-white/10 dark:stroke-white/10 stroke-black/10 fill-black/10"
        />
      </div>
    </div>
  );
};

export function GridPattern({ width, height, x, y, squares, ...props }: any) {
  const patternId = useId();

  return (
    <svg aria-hidden="true" {...props}>
      <defs>
        <pattern
          id={patternId}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path d={`M.5 ${height}V.5H${width}`} fill="none" />
        </pattern>
      </defs>
      <rect
        width="100%"
        height="100%"
        strokeWidth={0}
        fill={`url(#${patternId})`}
      />
      {squares && (
        <svg x={x} y={y} className="overflow-visible">
          {squares.map(([x, y]: [number, number], idx: number) => (
            <rect
              strokeWidth="0"
              key={`${x}-${y}-${idx}`}
              width={width + 1}
              height={height + 1}
              x={x * width}
              y={y * height}
            />
          ))}
        </svg>
      )}
    </svg>
  );
}
