import type { LeaveBalance, LeaveRequest } from "@/types/leave";
import { LEAVE_TYPE_ANNUAL_QUOTA, LEAVE_TYPES } from "@/types/leave";

/**
 * Mock leave service. Replace the bodies of these functions with real API
 * calls once the Node.js backend exists — callers only depend on the
 * exported function signatures.
 */

export const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getLeaveRequests(): Promise<LeaveRequest[]> {
  await delay(250);
  return [...MOCK_LEAVE_REQUESTS].sort(
    (a, b) => new Date(b.appliedOn).getTime() - new Date(a.appliedOn).getTime()
  );
}

export function getLeaveBalances(employeeId: string, requests: LeaveRequest[]): LeaveBalance[] {
  const currentYear = new Date().getFullYear();
  return LEAVE_TYPES.map((type) => {
    const used = requests
      .filter(
        (request) =>
          request.employeeId === employeeId &&
          request.leaveType === type &&
          request.status === "Approved" &&
          new Date(request.startDate).getFullYear() === currentYear
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
