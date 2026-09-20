import { httpService } from "@/lib/http/http.service";
import { API_ENDPOINTS } from "@/lib/apiEndpoint";
import type { Expense, ExpenseCategory, ExpenseStatus } from "@/types/expense";

/**
 * Expenses — wired to the real HRMS backend's User > Expenses / Admin >
 * Expenses API (see the "HRMS API" Postman collection). expenses.add is the
 * bar for self-managing your own claim (create/update/delete while still
 * "pending" — 400 EXPENSE_NOT_EDITABLE once decided); expenses.edit is the
 * separate, admin-wide "List All / Update Any" surface, deliberately not
 * expenses.view (every role gets that by default for self-service).
 */

export interface ExpensePayload {
  category: ExpenseCategory;
  amount: number;
  date: string;
  description: string;
}

interface RawEmployeeRef {
  id?: string;
  _id?: string;
  name?: string;
}

interface RawExpense {
  id?: string;
  _id?: string;
  employee?: RawEmployeeRef | string | null;
  category?: string;
  description?: string;
  amount?: number;
  date?: string;
  createdAt?: string;
  status?: string;
  rejectionReason?: string;
}

function normalizeStatus(value: string | undefined): ExpenseStatus {
  const lower = value?.toLowerCase();
  if (lower === "approved") return "Approved";
  if (lower === "rejected") return "Rejected";
  if (lower === "reimbursed") return "Reimbursed";
  return "Pending";
}

function mapExpense(raw: RawExpense): Expense {
  const employee = typeof raw.employee === "object" && raw.employee ? raw.employee : undefined;
  return {
    id: raw.id ?? raw._id ?? "",
    employeeId: employee?.id ?? employee?._id ?? "",
    employeeName: employee?.name ?? "—",
    category: (raw.category as ExpenseCategory) ?? "Other",
    description: raw.description ?? "",
    amount: raw.amount ?? 0,
    spentOn: raw.date ?? "",
    submittedOn: raw.createdAt ?? "",
    status: normalizeStatus(raw.status),
  };
}

// This backend's list endpoints have been seen wrapping under the singular
// resource name (e.g. Admin > Leave's { "leave": [...] }) rather than the
// plural — check both.
function unwrap(data: { expense?: RawExpense[]; expenses?: RawExpense[] } | RawExpense[]): RawExpense[] {
  return Array.isArray(data) ? data : (data.expenses ?? data.expense ?? []);
}

function bySubmittedDesc(a: Expense, b: Expense) {
  return new Date(b.submittedOn).getTime() - new Date(a.submittedOn).getTime();
}

/* --------------------------- User > Expenses ----------------------------- */

export async function getMyExpenses(status?: ExpenseStatus): Promise<Expense[]> {
  const data = await httpService.get<Parameters<typeof unwrap>[0]>(
    API_ENDPOINTS.user.expenses,
    status ? { status: status.toLowerCase() } : undefined
  );
  return unwrap(data).map(mapExpense).sort(bySubmittedDesc);
}

/** Always created "pending". */
export async function submitExpense(payload: ExpensePayload): Promise<void> {
  await httpService.post(API_ENDPOINTS.user.expenses, payload);
}

/** Only while still "pending". */
export async function updateMyExpense(id: string, payload: Partial<ExpensePayload>): Promise<void> {
  await httpService.patch(API_ENDPOINTS.user.expenseById(id), payload);
}

/** Only while still "pending". */
export async function deleteMyExpense(id: string): Promise<void> {
  await httpService.delete(API_ENDPOINTS.user.expenseById(id));
}

/* --------------------------- Admin > Expenses ---------------------------- */

export async function listAllExpenses(
  filters: { status?: ExpenseStatus; employeeId?: string; category?: string } = {}
): Promise<Expense[]> {
  const query: Record<string, string> = {};
  if (filters.status) query.status = filters.status.toLowerCase();
  if (filters.employeeId) query.employeeId = filters.employeeId;
  if (filters.category) query.category = filters.category;
  const data = await httpService.get<Parameters<typeof unwrap>[0]>(API_ENDPOINTS.admin.expenses, query);
  return unwrap(data).map(mapExpense).sort(bySubmittedDesc);
}

/** Not limited to pending, unlike the self-service PATCH above. */
export async function updateAnyExpense(id: string, payload: Partial<ExpensePayload>): Promise<void> {
  await httpService.patch(API_ENDPOINTS.admin.expenseById(id), payload);
}

export async function approveExpense(id: string): Promise<void> {
  await httpService.patch(API_ENDPOINTS.admin.expenseStatus(id), { status: "approved" });
}

export async function rejectExpense(id: string, rejectionReason: string): Promise<void> {
  await httpService.patch(API_ENDPOINTS.admin.expenseStatus(id), { status: "rejected", rejectionReason });
}

export async function deleteAnyExpense(id: string): Promise<void> {
  await httpService.delete(API_ENDPOINTS.admin.expenseById(id));
}
