import type { EmployeePayrollRow, Payslip, SalaryComponent } from "@/types/payroll";
import { MOCK_EMPLOYEES } from "@/services/employee.service";

/**
 * Mock payroll service. Replace the bodies of these functions with real
 * API calls once the Node.js backend exists.
 */

export const MOCK_SALARY_COMPONENTS: SalaryComponent[] = [
  { label: "Basic Salary", amount: 65000, type: "earning" },
  { label: "House Rent Allowance", amount: 26000, type: "earning" },
  { label: "Special Allowance", amount: 18500, type: "earning" },
  { label: "Performance Bonus", amount: 5000, type: "earning" },
  { label: "Provident Fund", amount: 7800, type: "deduction" },
  { label: "Professional Tax", amount: 200, type: "deduction" },
  { label: "Income Tax (TDS)", amount: 9200, type: "deduction" },
];

export const MOCK_PAYSLIPS: Payslip[] = [
  { id: "PS-2608", month: "August", year: 2026, gross: 114500, deductions: 17200, net: 97300, status: "Processed", generatedOn: "2026-08-31" },
  { id: "PS-2607", month: "July", year: 2026, gross: 114500, deductions: 17200, net: 97300, status: "Processed", generatedOn: "2026-07-31" },
  { id: "PS-2606", month: "June", year: 2026, gross: 112500, deductions: 16800, net: 95700, status: "Processed", generatedOn: "2026-06-30" },
  { id: "PS-2605", month: "May", year: 2026, gross: 112500, deductions: 16800, net: 95700, status: "Processed", generatedOn: "2026-05-31" },
  { id: "PS-2609", month: "September", year: 2026, gross: 114500, deductions: 17200, net: 97300, status: "Pending", generatedOn: "2026-09-30" },
];

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
  return MOCK_EMPLOYEES.slice(0, 12).map((employee, index) => {
    const gross = 55000 + (index % 6) * 12000;
    const deductions = Math.round(gross * 0.15);
    return {
      employeeId: employee.id,
      employeeName: employee.name,
      designation: employee.designation,
      gross,
      deductions,
      net: gross - deductions,
      status: index % 5 === 0 ? "Pending" : "Processed",
    };
  });
}
