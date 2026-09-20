import { httpService } from "@/lib/http/http.service";
import { API_ENDPOINTS } from "@/lib/apiEndpoint";
import {
  ASSIGNMENT_STATUSES,
  type ApiProject,
  type AssignmentFilters,
  type AssignmentStatus,
  type CreateProjectPayload,
  type ProjectAssignment,
  type ProjectStatus,
  type UpdateProjectPayload,
} from "@/types/project";

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
    API_ENDPOINTS.admin.projects,
    status ? { status } : undefined
  );
  const projects = Array.isArray(data) ? data : (data.projects ?? []);
  return projects.map(mapProject);
}

export async function createProject(payload: CreateProjectPayload): Promise<ApiProject> {
  const data = await httpService.post<{ project?: ApiProjectRaw } | ApiProjectRaw>(
    API_ENDPOINTS.admin.projects,
    payload
  );
  return mapProject("project" in data && data.project ? data.project : (data as ApiProjectRaw));
}

export async function updateProject(id: string, payload: UpdateProjectPayload): Promise<ApiProject> {
  const data = await httpService.patch<{ project?: ApiProjectRaw } | ApiProjectRaw>(
    API_ENDPOINTS.admin.projectById(id),
    payload
  );
  return mapProject("project" in data && data.project ? data.project : (data as ApiProjectRaw));
}

export async function deleteProject(id: string): Promise<void> {
  await httpService.delete<{ message?: string }>(API_ENDPOINTS.admin.projectById(id));
}

/* ---- Assignments (User > My Projects, Admin > Project Assignments) ---- */

interface RawAssignmentRef {
  id?: string;
  _id?: string;
  userId?: string;
  name?: string;
  employeeId?: string;
  firstName?: string;
  lastName?: string;
}

interface RawAssignment {
  id?: string;
  _id?: string;
  project?: (ApiProjectRaw & RawAssignmentRef) | string | null;
  projectId?: string;
  projectName?: string;
  projectStatus?: string;
  status?: string;
  employee?: RawAssignmentRef | string | null;
  user?: RawAssignmentRef | string | null;
  createdAt?: string;
  assignedAt?: string;
}

function mapAssignment(raw: RawAssignment): ProjectAssignment {
  const project = typeof raw.project === "object" && raw.project ? raw.project : undefined;
  const person = (typeof raw.employee === "object" && raw.employee) || (typeof raw.user === "object" && raw.user) || undefined;
  const status = raw.status as AssignmentStatus;
  return {
    id: raw.id ?? raw._id ?? "",
    projectId: project?.id ?? project?._id ?? raw.projectId ?? (typeof raw.project === "string" ? raw.project : ""),
    projectName: project?.name ?? raw.projectName ?? "Unnamed project",
    projectDescription: project?.description,
    projectStatus: (project?.status ?? raw.projectStatus) === "inactive" ? "inactive" : "active",
    status: (ASSIGNMENT_STATUSES as readonly string[]).includes(status) ? status : "active",
    userId: person?.userId ?? person?.id ?? person?._id,
    employeeName: person ? (person.name ?? ([person.firstName, person.lastName].filter(Boolean).join(" ").trim() || undefined)) : undefined,
    employeeCode: person?.employeeId,
    assignedAt: raw.assignedAt ?? raw.createdAt,
  };
}

function unwrapAssignments(
  data: { assignments?: RawAssignment[]; projects?: RawAssignment[] } | RawAssignment[]
): RawAssignment[] {
  return Array.isArray(data) ? data : (data.assignments ?? data.projects ?? []);
}

function cleanParams(params: AssignmentFilters): Record<string, string> | undefined {
  const entries = Object.entries(params).filter(([, v]) => Boolean(v)) as [string, string][];
  return entries.length ? Object.fromEntries(entries) : undefined;
}

/** User > My Projects — the caller's own assignments. `status` filters the
 * assignment, `projectStatus` the joined project — two independent filters. */
export async function listMyProjects(filters: Pick<AssignmentFilters, "status" | "projectStatus"> = {}): Promise<ProjectAssignment[]> {
  const data = await httpService.get<Parameters<typeof unwrapAssignments>[0]>(API_ENDPOINTS.user.projects, cleanParams(filters));
  return unwrapAssignments(data).map(mapAssignment);
}

/** Admin > Project Assignments > List (projects.edit). */
export async function listAssignments(filters: AssignmentFilters = {}): Promise<ProjectAssignment[]> {
  const data = await httpService.get<Parameters<typeof unwrapAssignments>[0]>(API_ENDPOINTS.admin.projectAssignments, cleanParams(filters));
  return unwrapAssignments(data).map(mapAssignment);
}

/** userId (not the Employee document's _id). 409 ALREADY_ASSIGNED if it already exists. */
export async function assignProject(params: { userId: string; projectId: string }): Promise<void> {
  await httpService.post(API_ENDPOINTS.admin.projectAssignments, params);
}

export async function updateAssignmentStatus(id: string, status: AssignmentStatus): Promise<void> {
  await httpService.patch(API_ENDPOINTS.admin.projectAssignmentById(id), { status });
}

export async function unassignProject(id: string): Promise<void> {
  await httpService.delete(API_ENDPOINTS.admin.projectAssignmentById(id));
}

/**
 * The caller's own teammates — everyone else assigned to any project the
 * caller is themselves assigned to (via My Projects, self-service). Used to
 * scope "My Team" (Employee Directory, as a manager) to real project
 * teammates instead of the whole company. Listing a project's other
 * assignees needs the admin endpoint (projects.edit) — if the caller's role
 * doesn't have that, this throws and the caller should fall back to an
 * unscoped view rather than a broken one.
 */
export async function getMyTeammateUserIds(): Promise<Set<string>> {
  const myProjects = await listMyProjects();
  const projectIds = [...new Set(myProjects.map((p) => p.projectId))];
  if (projectIds.length === 0) return new Set();

  const assignmentLists = await Promise.all(projectIds.map((projectId) => listAssignments({ projectId })));
  const teammateIds = new Set<string>();
  for (const assignments of assignmentLists) {
    for (const assignment of assignments) {
      if (assignment.userId) teammateIds.add(assignment.userId);
    }
  }
  return teammateIds;
}
