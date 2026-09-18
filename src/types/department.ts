export type DepartmentStatus = "active" | "inactive";

export interface ApiDepartment {
  id: string;
  name: string;
  description?: string;
  head?: string;
  status: DepartmentStatus;
}

export interface CreateDepartmentPayload {
  name: string;
  description?: string;
}

export interface UpdateDepartmentPayload {
  name?: string;
  description?: string;
  head?: string;
  status?: DepartmentStatus;
}
