import type { Employee } from "@/types/employee";

/**
 * Mock employee directory service. Replace the body of getEmployees with a
 * real API call once the Node.js backend exists — callers only depend on
 * this function's signature (Promise<Employee[]>).
 */

export const MOCK_EMPLOYEES: Employee[] = [];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getEmployees(): Promise<Employee[]> {
  await delay(250);
  return MOCK_EMPLOYEES;
}

export function getEmployeeById(id: string): Employee | undefined {
  return MOCK_EMPLOYEES.find((employee) => employee.id === id);
}
