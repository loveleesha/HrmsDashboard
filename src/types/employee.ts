export type Department =
  | "Engineering"
  | "HR"
  | "Finance"
  | "Marketing"
  | "Sales"
  | "Operations";

export type DesignationLevel =
  | "Manager"
  | "Senior"
  | "Associate"
  | "Executive"
  | "Intern";

export type EmploymentStatus = "Active" | "On Leave" | "Remote" | "Inactive";

export type WorkLocationType = "Office" | "Remote" | "Hybrid";

export type PerformanceLabel = "Excellent" | "Good" | "Average" | "Low";

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  designation: string;
  level: DesignationLevel;
  department: Department;
  city: string;
  workLocationType: WorkLocationType;
  status: EmploymentStatus;
  performanceScore: number;
  skills: string[];
  badges: string[];
  joinedDate: string;
  manager?: string;
}

export const DEPARTMENTS: Department[] = [
  "Engineering",
  "HR",
  "Finance",
  "Marketing",
  "Sales",
  "Operations",
];

export const DESIGNATION_LEVELS: DesignationLevel[] = [
  "Manager",
  "Senior",
  "Associate",
  "Executive",
  "Intern",
];

export const EMPLOYMENT_STATUSES: EmploymentStatus[] = [
  "Active",
  "On Leave",
  "Remote",
  "Inactive",
];

export const WORK_LOCATION_TYPES: WorkLocationType[] = [
  "Office",
  "Remote",
  "Hybrid",
];
