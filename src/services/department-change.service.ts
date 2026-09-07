import type { DepartmentChangeRequest } from "@/types/department-change";

/**
 * Mock department-change request service. Replace the bodies of these
 * functions with real API calls once the Node.js backend exists.
 */

export const MOCK_DEPARTMENT_CHANGE_REQUESTS: DepartmentChangeRequest[] = [
  {
    id: "DCR-01",
    employeeId: "EMP-1204",
    employeeName: "Meera Nair",
    currentDepartment: "Engineering",
    requestedDepartment: "Operations",
    reason: "Interested in moving toward process and vendor management work.",
    status: "Pending",
    requestedOn: "2026-09-03",
  },
];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getDepartmentChangeRequests(): Promise<DepartmentChangeRequest[]> {
  await delay(200);
  return [...MOCK_DEPARTMENT_CHANGE_REQUESTS].sort(
    (a, b) => new Date(b.requestedOn).getTime() - new Date(a.requestedOn).getTime()
  );
}

export function newDepartmentChangeId(): string {
  return `DCR-${Math.floor(10 + Math.random() * 89)}`;
}
