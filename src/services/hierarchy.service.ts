import { listEmployeesRemote } from "@/services/employee.service";
import { listAssignments, listProjects } from "@/services/project.service";
import type { ProjectAssignment } from "@/types/project";
import type { Employee } from "@/types/employee";
import {
  MANAGER_ROLE,
  type HierarchyAssignment,
  type HierarchyData,
  type HierarchyEmployeeRef,
  type HierarchyManagerContext,
  type HierarchyManagerProject,
  type HierarchyProject,
  type HierarchySummary,
} from "@/types/hierarchy";

/**
 * Project & Team Hierarchy — there is no dedicated "org hierarchy" endpoint
 * in the "HRMS API" Postman collection, so this composes three endpoints
 * that already exist and are wired for real elsewhere in this app:
 *
 *  - Admin > Projects > List Projects         (project.service.ts)
 *  - Admin > Project Assignments > List All   (project.service.ts)
 *  - Admin > Employees > List Employees       (employee.service.ts)
 *
 * The relationships drawn from that data:
 *  - "Manager" = an employee whose account role is literally named
 *    "manager" (this app's own role vocabulary — see types/user.ts).
 *  - "Reports to" = Employee.manager, a free-text manager *name* (not an
 *    id) already surfaced elsewhere in the app (Profile > Basic Info's
 *    "Reports to {name}"). An employee is placed under a manager, within a
 *    project, when both are assigned to that project AND the employee's
 *    Employee.manager string matches the manager's name.
 *
 * There's no backend field for "which employees does this manager manage,
 * globally" — only per-project, from the above. A manager with no reports
 * on any of their own assigned projects still appears (with zero reports)
 * rather than being hidden.
 *
 * Scale note: the employee directory has no "fetch by id list" endpoint, so
 * building the tree needs one bounded fetch of the directory (EMPLOYEE_FETCH_LIMIT)
 * to resolve names/designations/roles. An org larger than that limit will
 * still render every project/assignment correctly (assignment records carry
 * their own employeeName/employeeCode), but manager-detection and the
 * "reports to" linkage only cover employees within that fetched page. This
 * mirrors a limitation already present elsewhere in this app (e.g.
 * employee.service.ts's getEmployees()), not something new to this module.
 */

const EMPLOYEE_FETCH_LIMIT = 500;

function toHierarchyEmployeeRef(employee: Employee): HierarchyEmployeeRef {
  return {
    userId: employee.id,
    employeeRecordId: employee.employeeRecordId,
    name: employee.name,
    employeeId: employee.employeeId,
    designation: employee.designation,
    department: employee.department,
    status: employee.status,
    avatarUrl: employee.avatarUrl,
    role: employee.role,
    reportsTo: employee.manager,
  };
}

export function isManager(employee: HierarchyEmployeeRef): boolean {
  return employee.role === MANAGER_ROLE;
}

export async function buildHierarchy(): Promise<HierarchyData> {
  const [projectsRaw, assignments, employeeResult] = await Promise.all([
    listProjects(),
    listAssignments(),
    listEmployeesRemote({ limit: EMPLOYEE_FETCH_LIMIT }),
  ]);

  const employeesById = new Map<string, HierarchyEmployeeRef>();
  const employeesByCode = new Map<string, HierarchyEmployeeRef>();
  for (const employee of employeeResult.employees) {
    const ref = toHierarchyEmployeeRef(employee);
    employeesById.set(employee.id, ref);
    if (ref.employeeId) employeesByCode.set(ref.employeeId, ref);
  }

  // Resolutions that don't land on a real directory entry (an aliased
  // employeeCode match, or a last-resort stub) are cached here instead of
  // in employeesById — that map is returned as-is to build every "all
  // employees" dropdown/filter/count in the UI, so writing an alias into it
  // keyed by a *different* id than the employee's canonical one would make
  // the same person appear twice in every one of those lists (and collide
  // as a duplicate React key). This cache only speeds up resolveEmployee
  // itself; it never leaves this function.
  const resolvedAssigneeCache = new Map<string, HierarchyEmployeeRef>();

  /**
   * Project Assignments carries its own userId on each assignment, but per
   * the Postman collection's own note on Assets ("{{stepOnboardUserId}}'s
   * Employee _id is NOT the same as userId"), this backend isn't consistent
   * about which id a populated sub-document exposes — some endpoints hand
   * back the Employee document's own _id where others expect/return the
   * User's id. When the assignment's userId doesn't match anything in the
   * employee directory, fall back to the assignment's own employeeCode
   * (e.g. "EMP-0006"), which is stable and shared across both shapes,
   * before giving up and rendering a minimal stub (name/code only, no role
   * — so it won't be picked up as a manager).
   */
  function resolveEmployee(assignment: ProjectAssignment): HierarchyEmployeeRef | null {
    if (!assignment.userId) return null;

    const byId = employeesById.get(assignment.userId);
    if (byId) return byId;

    const cached = resolvedAssigneeCache.get(assignment.userId);
    if (cached) return cached;

    if (assignment.employeeCode) {
      const byCode = employeesByCode.get(assignment.employeeCode);
      if (byCode) {
        resolvedAssigneeCache.set(assignment.userId, byCode);
        return byCode;
      }
    }

    const fallback: HierarchyEmployeeRef = {
      userId: assignment.userId,
      name: assignment.employeeName ?? "Unknown",
      employeeId: assignment.employeeCode,
      designation: "—",
      department: "—",
      status: "active",
    };
    resolvedAssigneeCache.set(assignment.userId, fallback);
    return fallback;
  }

  const assignmentsByProject = new Map<string, HierarchyAssignment[]>();
  const rawAssignmentsByEmployee = new Map<string, ProjectAssignment[]>();

  for (const assignment of assignments) {
    const employee = resolveEmployee(assignment);
    if (!employee) continue;

    const entry: HierarchyAssignment = { assignmentId: assignment.id, employee, status: assignment.status };
    if (!assignmentsByProject.has(assignment.projectId)) assignmentsByProject.set(assignment.projectId, []);
    assignmentsByProject.get(assignment.projectId)!.push(entry);

    if (!rawAssignmentsByEmployee.has(employee.userId)) rawAssignmentsByEmployee.set(employee.userId, []);
    rawAssignmentsByEmployee.get(employee.userId)!.push(assignment);
  }

  const projects: HierarchyProject[] = projectsRaw.map((project) => {
    const projectAssignments = assignmentsByProject.get(project.id) ?? [];
    const managers = projectAssignments.filter((a) => isManager(a.employee)).map((a) => a.employee);
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      lead: project.lead,
      status: project.status,
      assignments: projectAssignments,
      managers,
    };
  });

  const allManagers = [...employeesById.values()].filter(isManager);
  const managerContexts = new Map<string, HierarchyManagerContext>();

  for (const manager of allManagers) {
    const ownAssignments = rawAssignmentsByEmployee.get(manager.userId) ?? [];
    const ownProjects: HierarchyManagerProject[] = ownAssignments.map((assignment) => {
      const projectEmployees = (assignmentsByProject.get(assignment.projectId) ?? [])
        .map((entry) => entry.employee)
        .filter((employee) => employee.userId !== manager.userId && employee.reportsTo === manager.name);
      return {
        projectId: assignment.projectId,
        projectName: assignment.projectName,
        projectStatus: assignment.projectStatus,
        employees: projectEmployees,
      };
    });
    managerContexts.set(manager.userId, { manager, ownProjects });
  }

  const summary: HierarchySummary = {
    totalProjects: projects.length,
    activeProjects: projects.filter((p) => p.status === "active").length,
    totalManagers: allManagers.length,
    totalEmployees: employeesById.size,
  };

  return { summary, projects, managerContexts, employeesById };
}
