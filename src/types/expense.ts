export type ExpenseStatus = "Pending" | "Approved" | "Rejected" | "Reimbursed";
export const EXPENSE_CATEGORIES = ["Travel", "Meals", "Accommodation", "Office Supplies", "Client Entertainment", "Other"] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface Expense {
  id: string;
  employeeId: string;
  employeeName: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  spentOn: string;
  submittedOn: string;
  status: ExpenseStatus;
}
