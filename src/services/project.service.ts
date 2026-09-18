import { httpService } from "@/lib/http/http.service";
import type { ApiProject, CreateProjectPayload, ProjectStatus, UpdateProjectPayload } from "@/types/project";

/**
 * Projects service — wired to the real HRMS backend's Admin > Projects API
 * (see the "HRMS API" Postman collection). A simple CRUD master list
 * (projects.* permissions); name must be unique (409 NAME_ALREADY_EXISTS).
 */

interface ApiProjectRaw {
  id?: string;
  _id?: string;
  name: string;
  description?: string;
  lead?: string;
  status?: string;
}

function mapProject(raw: ApiProjectRaw): ApiProject {
  return {
    id: raw.id ?? raw._id ?? raw.name,
    name: raw.name,
    description: raw.description,
    lead: raw.lead,
    status: raw.status === "inactive" ? "inactive" : "active",
  };
}

export async function listProjects(status?: ProjectStatus): Promise<ApiProject[]> {
  const data = await httpService.get<{ projects?: ApiProjectRaw[] } | ApiProjectRaw[]>(
    "/api/admin/projects",
    status ? { status } : undefined
  );
  const projects = Array.isArray(data) ? data : (data.projects ?? []);
  return projects.map(mapProject);
}

export async function createProject(payload: CreateProjectPayload): Promise<ApiProject> {
  const data = await httpService.post<{ project?: ApiProjectRaw } | ApiProjectRaw>("/api/admin/projects", payload);
  return mapProject("project" in data && data.project ? data.project : (data as ApiProjectRaw));
}

export async function updateProject(id: string, payload: UpdateProjectPayload): Promise<ApiProject> {
  const data = await httpService.patch<{ project?: ApiProjectRaw } | ApiProjectRaw>(
    `/api/admin/projects/${id}`,
    payload
  );
  return mapProject("project" in data && data.project ? data.project : (data as ApiProjectRaw));
}

export async function deleteProject(id: string): Promise<void> {
  await httpService.delete<{ message?: string }>(`/api/admin/projects/${id}`);
}
