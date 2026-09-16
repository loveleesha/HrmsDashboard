/**
 * A curated pick-list used by forms that set a department (onboarding,
 * department-change requests, job postings, ...) — the real API treats
 * `department` as free text for search/filter purposes, but a fixed list
 * keeps data entry consistent instead of inviting typos.
 */
export type Department = "Engineering" | "HR" | "Finance" | "Marketing" | "Sales" | "Operations";

export const DEPARTMENTS: Department[] = ["Engineering", "HR", "Finance", "Marketing", "Sales", "Operations"];

/** The real API's status enum (Admin > Employees) — lowercase, hyphenated.
 * Only "active"/"inactive" are settable via the status-toggle endpoint;
 * "on-leave"/"terminated" come from separate workflows. */
export type EmploymentStatus = "active" | "inactive" | "on-leave" | "terminated";

export const EMPLOYMENT_STATUSES: EmploymentStatus[] = ["active", "inactive", "on-leave", "terminated"];

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  "on-leave": "On Leave",
  terminated: "Terminated",
};

export interface Employee {
  /** The account's userId — what every admin employee endpoint keys by. */
  id: string;
  employeeId?: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  designation: string;
  department: string;
  /** Free-text (case-insensitive partial match server-side), not a fixed enum. */
  location?: string;
  /** Free-text ("Full-time", "Part-time", ...) — matches the onboarding wizard's EmploymentType. */
  employmentType?: string;
  status: EmploymentStatus;
  /** Role name from Settings -> Role & Access. */
  role?: string;
  skills: string[];
  joinedDate?: string;
  manager?: string;
  onboardingStatus?: string;
}
