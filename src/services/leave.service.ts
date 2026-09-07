import type { LeaveBalance, LeaveRequest } from "@/types/leave";
import { LEAVE_TYPE_ANNUAL_QUOTA, LEAVE_TYPES } from "@/types/leave";
import { getEmployeeById } from "@/services/employee.service";

/**
 * Mock leave service. Replace the bodies of these functions with real API
 * calls once the Node.js backend exists — callers only depend on the
 * exported function signatures.
 */

function employeeName(id: string) {
  return getEmployeeById(id)?.name ?? "Unknown";
}
function employeeDesignation(id: string) {
  return getEmployeeById(id)?.designation ?? "";
}
function employeeDepartment(id: string) {
  return getEmployeeById(id)?.department ?? "";
}

export const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: "LR-3001",
    employeeId: "EMP-1204",
    employeeName: employeeName("EMP-1204"),
    designation: employeeDesignation("EMP-1204"),
    department: employeeDepartment("EMP-1204"),
    leaveType: "Sick Leave",
    startDate: "2026-09-08",
    endDate: "2026-09-09",
    days: 2,
    reason: "Fever and body ache, need to rest and recover.",
    status: "Pending",
    appliedOn: "2026-09-06",
  },
  {
    id: "LR-3002",
    employeeId: "EMP-1256",
    employeeName: employeeName("EMP-1256"),
    designation: employeeDesignation("EMP-1256"),
    department: employeeDepartment("EMP-1256"),
    leaveType: "Casual Leave",
    startDate: "2026-09-11",
    endDate: "2026-09-11",
    days: 1,
    reason: "Sister's engagement ceremony.",
    status: "Pending",
    appliedOn: "2026-09-05",
  },
  {
    id: "LR-3003",
    employeeId: "EMP-1301",
    employeeName: employeeName("EMP-1301"),
    designation: employeeDesignation("EMP-1301"),
    department: employeeDepartment("EMP-1301"),
    leaveType: "Earned Leave",
    startDate: "2026-09-21",
    endDate: "2026-09-25",
    days: 5,
    reason: "Family trip to Goa, planned months in advance.",
    status: "Pending",
    appliedOn: "2026-09-04",
  },
  {
    id: "LR-3004",
    employeeId: "EMP-1418",
    employeeName: employeeName("EMP-1418"),
    designation: employeeDesignation("EMP-1418"),
    department: employeeDepartment("EMP-1418"),
    leaveType: "Casual Leave",
    startDate: "2026-09-10",
    endDate: "2026-09-10",
    days: 1,
    reason: "Personal work at the bank.",
    status: "Pending",
    appliedOn: "2026-09-07",
  },
  {
    id: "LR-3005",
    employeeId: "EMP-1438",
    employeeName: employeeName("EMP-1438"),
    designation: employeeDesignation("EMP-1438"),
    department: employeeDepartment("EMP-1438"),
    leaveType: "Sick Leave",
    startDate: "2026-09-09",
    endDate: "2026-09-09",
    days: 1,
    reason: "Dental procedure follow-up.",
    status: "Pending",
    appliedOn: "2026-09-07",
  },
  {
    id: "LR-2991",
    employeeId: "EMP-1188",
    employeeName: employeeName("EMP-1188"),
    designation: employeeDesignation("EMP-1188"),
    department: employeeDepartment("EMP-1188"),
    leaveType: "Sick Leave",
    startDate: "2026-09-01",
    endDate: "2026-09-05",
    days: 5,
    reason: "Recovering from minor surgery.",
    status: "Approved",
    appliedOn: "2026-08-27",
    approverName: "Karan Malhotra",
    approvedOn: "2026-08-28",
  },
  {
    id: "LR-2988",
    employeeId: "EMP-1120",
    employeeName: employeeName("EMP-1120"),
    designation: employeeDesignation("EMP-1120"),
    department: employeeDepartment("EMP-1120"),
    leaveType: "Earned Leave",
    startDate: "2026-08-24",
    endDate: "2026-08-28",
    days: 5,
    reason: "Annual vacation with family.",
    status: "Approved",
    appliedOn: "2026-08-10",
    approverName: "Karan Malhotra",
    approvedOn: "2026-08-11",
  },
  {
    id: "LR-2975",
    employeeId: "EMP-1027",
    employeeName: employeeName("EMP-1027"),
    designation: employeeDesignation("EMP-1027"),
    department: employeeDepartment("EMP-1027"),
    leaveType: "Casual Leave",
    startDate: "2026-08-18",
    endDate: "2026-08-19",
    days: 2,
    reason: "Attending a relative's wedding.",
    status: "Approved",
    appliedOn: "2026-08-05",
    approverName: "Ananya Iyer",
    approvedOn: "2026-08-06",
  },
  {
    id: "LR-2960",
    employeeId: "EMP-1445",
    employeeName: employeeName("EMP-1445"),
    designation: employeeDesignation("EMP-1445"),
    department: employeeDepartment("EMP-1445"),
    leaveType: "Unpaid Leave",
    startDate: "2026-08-14",
    endDate: "2026-08-14",
    days: 1,
    reason: "Personal emergency, no leave balance remaining.",
    status: "Rejected",
    appliedOn: "2026-08-12",
    approverName: "Siddharth Rao",
    approvedOn: "2026-08-13",
    comment: "Insufficient notice given ongoing sprint deadlines. Please plan ahead next time.",
  },
  {
    id: "LR-2954",
    employeeId: "EMP-1465",
    employeeName: employeeName("EMP-1465"),
    designation: employeeDesignation("EMP-1465"),
    department: employeeDepartment("EMP-1465"),
    leaveType: "Casual Leave",
    startDate: "2026-08-07",
    endDate: "2026-08-08",
    days: 2,
    reason: "Moving to a new apartment.",
    status: "Rejected",
    appliedOn: "2026-08-04",
    approverName: "Kabir Singh",
    approvedOn: "2026-08-05",
    comment: "Team is short-staffed that week — please choose alternate dates.",
  },
  {
    id: "LR-2940",
    employeeId: "EMP-1101",
    employeeName: employeeName("EMP-1101"),
    designation: employeeDesignation("EMP-1101"),
    department: employeeDepartment("EMP-1101"),
    leaveType: "Earned Leave",
    startDate: "2026-07-20",
    endDate: "2026-07-24",
    days: 5,
    reason: "Family function out of town.",
    status: "Approved",
    appliedOn: "2026-07-05",
    approverName: "Karan Malhotra",
    approvedOn: "2026-07-06",
  },
  {
    id: "LR-2932",
    employeeId: "EMP-1101",
    employeeName: employeeName("EMP-1101"),
    designation: employeeDesignation("EMP-1101"),
    department: employeeDepartment("EMP-1101"),
    leaveType: "Sick Leave",
    startDate: "2026-06-11",
    endDate: "2026-06-12",
    days: 2,
    reason: "Viral fever.",
    status: "Approved",
    appliedOn: "2026-06-10",
    approverName: "Karan Malhotra",
    approvedOn: "2026-06-10",
  },
  {
    id: "LR-2920",
    employeeId: "EMP-1101",
    employeeName: employeeName("EMP-1101"),
    designation: employeeDesignation("EMP-1101"),
    department: employeeDepartment("EMP-1101"),
    leaveType: "Casual Leave",
    startDate: "2026-05-02",
    endDate: "2026-05-02",
    days: 1,
    reason: "Personal work.",
    status: "Approved",
    appliedOn: "2026-04-28",
    approverName: "Karan Malhotra",
    approvedOn: "2026-04-28",
  },
  {
    id: "LR-2900",
    employeeId: "EMP-1101",
    employeeName: employeeName("EMP-1101"),
    designation: employeeDesignation("EMP-1101"),
    department: employeeDepartment("EMP-1101"),
    leaveType: "Casual Leave",
    startDate: "2026-09-30",
    endDate: "2026-09-30",
    days: 1,
    reason: "Long weekend getaway.",
    status: "Cancelled",
    appliedOn: "2026-08-20",
  },
  {
    id: "LR-3010",
    employeeId: "EMP-1042",
    employeeName: employeeName("EMP-1042"),
    designation: employeeDesignation("EMP-1042"),
    department: employeeDepartment("EMP-1042"),
    leaveType: "Casual Leave",
    startDate: "2026-09-14",
    endDate: "2026-09-15",
    days: 2,
    reason: "Festival celebration at hometown.",
    status: "Pending",
    appliedOn: "2026-09-07",
  },
  {
    id: "LR-3011",
    employeeId: "EMP-1372",
    employeeName: employeeName("EMP-1372"),
    designation: employeeDesignation("EMP-1372"),
    department: employeeDepartment("EMP-1372"),
    leaveType: "Sick Leave",
    startDate: "2026-09-08",
    endDate: "2026-09-08",
    days: 1,
    reason: "Migraine, need a day of rest.",
    status: "Pending",
    appliedOn: "2026-09-07",
  },
];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getLeaveRequests(): Promise<LeaveRequest[]> {
  await delay(250);
  return [...MOCK_LEAVE_REQUESTS].sort(
    (a, b) => new Date(b.appliedOn).getTime() - new Date(a.appliedOn).getTime()
  );
}

const CURRENT_YEAR = 2026;

export function getLeaveBalances(employeeId: string, requests: LeaveRequest[]): LeaveBalance[] {
  return LEAVE_TYPES.map((type) => {
    const used = requests
      .filter(
        (request) =>
          request.employeeId === employeeId &&
          request.leaveType === type &&
          request.status === "Approved" &&
          new Date(request.startDate).getFullYear() === CURRENT_YEAR
      )
      .reduce((sum, request) => sum + request.days, 0);

    const total = LEAVE_TYPE_ANNUAL_QUOTA[type];
    return { type, total, used, remaining: Math.max(0, total - used) };
  });
}

export function calculateLeaveDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;

  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

export function getUpcomingTeamLeave(requests: LeaveRequest[], today: Date): LeaveRequest[] {
  const todayTime = today.setHours(0, 0, 0, 0);
  return requests
    .filter((request) => request.status === "Approved" && new Date(request.endDate).getTime() >= todayTime)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 6);
}

export function newLeaveRequestId(): string {
  return `LR-${Math.floor(4000 + Math.random() * 900)}`;
}
