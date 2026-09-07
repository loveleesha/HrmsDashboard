export type ProjectStatus = "Active" | "Released";

export interface Project {
  id: string;
  name: string;
}

export interface ProjectAllocation {
  projectId: string;
  projectName: string;
  allocatedHoursPerDay: number;
  status: ProjectStatus;
  dsrLoggedHours: number;
}
