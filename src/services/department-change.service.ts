import type { DepartmentChangeRequest } from "@/types/department-change";

/**
 * Mock department-change request service. Replace the bodies of these
 * functions with real API calls once the Node.js backend exists.
 */

export const MOCK_DEPARTMENT_CHANGE_REQUESTS: DepartmentChangeRequest[] = [];

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
