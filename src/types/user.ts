export const ROLES = [
  "super_admin",
  "hr_admin",
  "hr_executive",
  "manager",
  "employee",
  "special_employee",
  "recruiter",
  "payroll_admin",
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  hr_admin: "HR Admin",
  hr_executive: "HR Executive",
  manager: "Manager",
  employee: "Employee",
  special_employee: "Special Employee",
  recruiter: "Recruiter",
  payroll_admin: "Payroll Admin",
};

/** Admin-tier roles — per the "HRMS API" collection these are the only two
 * roles Admin > Auth > Register will create, and the only ones that log in
 * via /api/admin/login instead of /api/user/login. */
const ADMIN_TIER_ROLES = new Set<Role>(["super_admin", "hr_admin"]);

export function isAdminTierRole(role: Role | null | undefined): boolean {
  return Boolean(role && ADMIN_TIER_ROLES.has(role));
}

export interface User {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  role: Role;
  designation: string;
  department: string;
  avatarUrl?: string;
}
