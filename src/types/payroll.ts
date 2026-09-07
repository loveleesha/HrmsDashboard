export type SalaryComponentType = "earning" | "deduction";

export interface SalaryComponent {
  label: string;
  amount: number;
  type: SalaryComponentType;
}

export type PayslipStatus = "Processed" | "Pending";

export interface Payslip {
  id: string;
  month: string;
  year: number;
  gross: number;
  deductions: number;
  net: number;
  status: PayslipStatus;
  generatedOn: string;
}

export interface EmployeePayrollRow {
  employeeId: string;
  employeeName: string;
  designation: string;
  gross: number;
  deductions: number;
  net: number;
  status: PayslipStatus;
}
