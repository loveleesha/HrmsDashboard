export type ProjectStatus = "active" | "inactive";

export interface ApiProject {
  id: string;
  name: string;
  description?: string;
  lead?: string;
  status: ProjectStatus;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  lead?: string;
  status?: ProjectStatus;
}

/** An assignment's own lifecycle — independent of the project's active/inactive status. */
export const ASSIGNMENT_STATUSES = ["active", "completed", "on-hold"] as const;
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  active: "Active",
  completed: "Completed",
  "on-hold": "On Hold",
};

export interface ProjectAssignment {
  id: string;
  projectId: string;
  projectName: string;
  projectDescription?: string;
  /** The master project's active/inactive status. */
  projectStatus: ProjectStatus;
  /** This assignment's own status. */
  status: AssignmentStatus;
  /** Only populated on the admin list (who it's assigned to). */
  userId?: string;
  employeeName?: string;
  employeeCode?: string;
  assignedAt?: string;
}

export interface AssignmentFilters {
  status?: string;
  projectStatus?: string;
  projectId?: string;
  employeeId?: string;
}
