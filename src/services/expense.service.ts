import type { Expense } from "@/types/expense";
import { getEmployeeById } from "@/services/employee.service";

/**
 * Mock expense service. Replace the bodies of these functions with real
 * API calls once the Node.js backend exists.
 */

function name(employeeId: string) {
  return getEmployeeById(employeeId)?.name ?? "Unknown";
}

export const MOCK_EXPENSES: Expense[] = [
  { id: "EXP-01", employeeId: "EMP-1101", employeeName: name("EMP-1101"), category: "Travel", description: "Cab fare for client visit", amount: 850, spentOn: "2026-09-02", submittedOn: "2026-09-02", status: "Approved" },
  { id: "EXP-02", employeeId: "EMP-1101", employeeName: name("EMP-1101"), category: "Meals", description: "Team lunch during sprint planning offsite", amount: 2400, spentOn: "2026-08-28", submittedOn: "2026-08-28", status: "Reimbursed" },
  { id: "EXP-03", employeeId: "EMP-1204", employeeName: name("EMP-1204"), category: "Office Supplies", description: "Wireless mouse and keyboard", amount: 1650, spentOn: "2026-09-04", submittedOn: "2026-09-04", status: "Pending" },
  { id: "EXP-04", employeeId: "EMP-1256", employeeName: name("EMP-1256"), category: "Accommodation", description: "Hotel stay for conference in Pune", amount: 6200, spentOn: "2026-08-15", submittedOn: "2026-08-16", status: "Rejected" },
];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getExpenses(): Promise<Expense[]> {
  await delay(200);
  return [...MOCK_EXPENSES].sort((a, b) => new Date(b.submittedOn).getTime() - new Date(a.submittedOn).getTime());
}

export function newExpenseId(): string {
  return `EXP-${Math.floor(10 + Math.random() * 89)}`;
}
