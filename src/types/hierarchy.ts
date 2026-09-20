import type { EmploymentStatus } from "@/types/employee";
import type { AssignmentStatus, ProjectStatus } from "@/types/project";
import type { Role } from "@/types/user";

/** The role name this module treats as "a manager" — this app's own role
 * vocabulary (types/user.ts) already has "manager" as a real role, so this
 * is the one place that value is spelled out; every hierarchy file compares
 * against this constant instead of a raw string literal. */
export const MANAGER_ROLE: Role = "manager";

export type HierarchyNodeKind = "admin" | "project" | "manager" | "employee";

export interface HierarchyEmployeeRef {
  userId: string;
  employeeRecordId?: string;
  name: string;
  employeeId?: string;
  designation: string;
  department: string;
  status: EmploymentStatus;
  avatarUrl?: string;
  /** Role name — "manager" is what this module uses to detect managers. */
  role?: string;
  /** The manager's name this employee reports to (Employee.manager) — a
   * free-text name, not an id, per how the rest of the app already surfaces
   * it ("Reports to {name}" on the profile page). Used to link an employee
   * under the right manager in a project. */
  reportsTo?: string;
}

/** One Project node under the Admin root — every project in the company. */
export interface HierarchyProject {
  id: string;
  name: string;
  description?: string;
  lead?: string;
  status: ProjectStatus;
  /** Every assignment on this project, manager and non-manager alike. */
  assignments: HierarchyAssignment[];
  /** The subset of assignees whose role is "manager". */
  managers: HierarchyEmployeeRef[];
}

export interface HierarchyAssignment {
  assignmentId: string;
  employee: HierarchyEmployeeRef;
  status: AssignmentStatus;
}

/** A manager, as they appear nested under one specific top-level project —
 * their OWN project assignments (which may span other projects entirely)
 * become the next level down, per the Admin -> Project -> Manager ->
 * Project -> Employees shape. */
export interface HierarchyManagerContext {
  manager: HierarchyEmployeeRef;
  /** Every project this manager is themselves assigned to (their "own" projects). */
  ownProjects: HierarchyManagerProject[];
}

export interface HierarchyManagerProject {
  projectId: string;
  projectName: string;
  projectStatus: ProjectStatus;
  /** Employees on this project who report to the manager (Employee.manager === manager.name). */
  employees: HierarchyEmployeeRef[];
}

export interface HierarchySummary {
  totalProjects: number;
  activeProjects: number;
  totalManagers: number;
  totalEmployees: number;
}

export interface HierarchyData {
  summary: HierarchySummary;
  projects: HierarchyProject[];
  /** Every manager in the org, keyed by userId, with their own project/report breakdown. */
  managerContexts: Map<string, HierarchyManagerContext>;
  /** Full employee lookup by userId — used for node detail drawers and search. */
  employeesById: Map<string, HierarchyEmployeeRef>;
}

export type HierarchySearchResultKind = "project" | "manager" | "employee";

export interface HierarchySearchResult {
  kind: HierarchySearchResultKind;
  id: string;
  label: string;
  sublabel?: string;
  /** Path of node keys (see hierarchy.service's nodeKey) from the project
   * root down to this result — used to expand every ancestor. */
  path: string[];
}
