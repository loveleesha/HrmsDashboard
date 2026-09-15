import type { Expense } from "@/types/expense";

/**
 * Mock expense service. Replace the bodies of these functions with real
 * API calls once the Node.js backend exists.
 */

export const MOCK_EXPENSES: Expense[] = [];

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
