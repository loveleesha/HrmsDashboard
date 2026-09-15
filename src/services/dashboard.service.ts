import type { DashboardData } from "@/types/dashboard";

/**
 * Mock dashboard data service. Replace the body of getDashboardData with a
 * real API call once the Node.js backend exists — callers only depend on
 * this function's signature (Promise<DashboardData>).
 */

const MOCK_DASHBOARD_DATA: DashboardData = {
  stats: [],
  employeeGrowth: [],
  attendanceTrend: [],
  leaveTrend: [],
  departmentDistribution: [],
  todayAttendance: [],
  upcomingBirthdays: [],
  newJoinees: [],
  upcomingEvents: [],
  upcomingHolidays: [],
  pendingLeaveRequests: [],
  recentActivity: [],
  announcements: [],
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getDashboardData(): Promise<DashboardData> {
  await delay(300);
  return MOCK_DASHBOARD_DATA;
}
