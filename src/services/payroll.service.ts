import { httpService } from "@/lib/http/http.service";
import { API_ENDPOINTS } from "@/lib/apiEndpoint";
import type { EmployeePayrollRow, Payslip, SalaryComponent } from "@/types/payroll";

/** Payroll service — wired to the real backend (routes/User/payrollRoutes.js
 * for self-service, routes/Admin/payrollRoutes.js for company-wide payroll). */

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

interface RawPayslip {
  id: string;
  month: number;
  year: number;
  gross: number;
  deductions: number;
  net: number;
  status: "Pending" | "Processed";
  generatedOn: string;
}

function mapRawPayslip(raw: RawPayslip): Payslip {
  return {
    id: raw.id,
    month: MONTH_NAMES[raw.month - 1] ?? String(raw.month),
    year: raw.year,
    gross: raw.gross,
    deductions: raw.deductions,
    net: raw.net,
    status: raw.status,
    generatedOn: raw.generatedOn,
  };
}

export async function getMySalaryComponents(): Promise<SalaryComponent[]> {
  const data = await httpService.get<{ components: SalaryComponent[] }>(API_ENDPOINTS.user.mySalary);
  return data.components;
}

export async function getMyPayslips(): Promise<Payslip[]> {
  const data = await httpService.get<{ payslips: RawPayslip[] }>(API_ENDPOINTS.user.myPayslips);
  return data.payslips.map(mapRawPayslip).sort((a, b) => new Date(b.generatedOn).getTime() - new Date(a.generatedOn).getTime());
}

interface RawPayrollRow {
  employeeId: string;
  employeeName: string;
  designation: string;
  gross: number;
  deductions: number;
  net: number;
  status: "Pending" | "Processed";
}

export async function getCompanyPayroll(month?: number, year?: number): Promise<EmployeePayrollRow[]> {
  const query: Record<string, number> = {};
  if (month) query.month = month;
  if (year) query.year = year;
  const data = await httpService.get<{ payroll: RawPayrollRow[] }>(API_ENDPOINTS.admin.payrollPayslips, query);
  return data.payroll;
}

export async function processCompanyPayroll(
  month: number,
  year: number,
  employeeId?: string
): Promise<{ processedCount: number; skippedCount: number }> {
  return httpService.post(API_ENDPOINTS.admin.payrollProcess, { month, year, employeeId });
}

export async function getSalaryStructure(employeeId: string): Promise<SalaryComponent[]> {
  try {
    const data = await httpService.get<{ structure: { components: SalaryComponent[] } }>(API_ENDPOINTS.admin.salaryStructureByEmployee(employeeId));
    return data.structure.components;
  } catch {
    return [];
  }
}

export async function saveSalaryStructure(employeeId: string, components: SalaryComponent[]): Promise<void> {
  await httpService.put(API_ENDPOINTS.admin.salaryStructureByEmployee(employeeId), { components });
}
