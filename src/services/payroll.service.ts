import type { EmployeePayrollRow, Payslip, SalaryComponent } from "@/types/payroll";

/**
 * Mock payroll service. Replace the bodies of these functions with real
 * API calls once the Node.js backend exists.
 */

export const MOCK_SALARY_COMPONENTS: SalaryComponent[] = [];

export const MOCK_PAYSLIPS: Payslip[] = [];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getMySalaryComponents(): Promise<SalaryComponent[]> {
  await delay(200);
  return MOCK_SALARY_COMPONENTS;
}

export async function getMyPayslips(): Promise<Payslip[]> {
  await delay(200);
  return [...MOCK_PAYSLIPS].sort((a, b) => new Date(b.generatedOn).getTime() - new Date(a.generatedOn).getTime());
}

export async function getCompanyPayroll(): Promise<EmployeePayrollRow[]> {
  await delay(250);
  return [];
}
