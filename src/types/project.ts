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
