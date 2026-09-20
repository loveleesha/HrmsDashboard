"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Eye, UserPlus, UserCog, Pencil, Repeat, Trash2, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Button, buttonVariants } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { ConfirmModal } from "@/components/molecules/ConfirmModal";
import type { ActionMenuItem } from "@/components/molecules/ActionMenu";
import { HierarchySummaryCards } from "@/components/organisms/hierarchy/HierarchySummaryCards";
import { HierarchySearch } from "@/components/organisms/hierarchy/HierarchySearch";
import { HierarchyFilters } from "@/components/organisms/hierarchy/HierarchyFilters";
import { HierarchyToolbar } from "@/components/organisms/hierarchy/HierarchyToolbar";
import { HierarchyTree, type HierarchyTreeHandle } from "@/components/organisms/hierarchy/HierarchyTree";
import { HierarchyMobileView } from "@/components/organisms/hierarchy/HierarchyMobileView";
import { NodeDetailsDrawer, type NodeDetailsTarget } from "@/components/organisms/hierarchy/NodeDetailsDrawer";
import { EmployeeDrawer } from "@/components/organisms/hierarchy/EmployeeDrawer";
import { AssignManagerModal } from "@/components/organisms/hierarchy/AssignManagerModal";
import { AssignEmployeeModal, type AssignEmployeeProjectOption } from "@/components/organisms/hierarchy/AssignEmployeeModal";
import { AssignProjectModal } from "@/components/organisms/projects/AssignProjectModal";
import { ProjectFormModal } from "@/components/organisms/projects/ProjectFormModal";
import { AccessRestricted } from "@/components/templates/AccessRestricted";
import { useHierarchy } from "@/hooks/use-hierarchy";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/use-rbac";
import { assignProject, createProject, unassignProject, updateProject } from "@/services/project.service";
import { isManager } from "@/services/hierarchy.service";
import type { HierarchyEmployeeRef, HierarchyProject } from "@/types/hierarchy";

export default function ProjectHierarchyPage() {
  const { showToast } = useToast();
  const { can, viewAsRole } = useRBAC();

  // This view composes admin-tier endpoints (project-assignments, the
  // employee directory) that plain projects.view (every role's self-service
  // default) doesn't cover — gate the whole page on projects.edit, the same
  // bar the Assignments tab on /projects already uses for admin-wide data.
  const canViewHierarchy = can("projects", "edit");
  const hierarchy = useHierarchy(canViewHierarchy);
  const treeRef = useRef<HierarchyTreeHandle>(null);

  const canAssign = can("projects", "add");
  const canEditProject = can("projects", "edit");
  const canRemoveAssignment = can("projects", "delete");

  const [detailsTarget, setDetailsTarget] = useState<NodeDetailsTarget | null>(null);
  const [employeeDrawer, setEmployeeDrawer] = useState<{ title: string; employees: HierarchyEmployeeRef[] } | null>(null);
  const [assignManagerTarget, setAssignManagerTarget] = useState<HierarchyProject | null>(null);
  const [assignEmployeeTarget, setAssignEmployeeTarget] = useState<{
    manager: HierarchyEmployeeRef | null;
    projectOptions: AssignEmployeeProjectOption[];
  } | null>(null);
  const [genericAssignOpen, setGenericAssignOpen] = useState(false);
  const [editProjectTarget, setEditProjectTarget] = useState<HierarchyProject | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{ assignmentId: string; label: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, error, isLoading, reload } = hierarchy;

  // Filters narrow which top-level projects are shown (a project stays if
  // it, or anything on it, matches) — nothing is pruned *inside* a project
  // once it's included, so a matched branch never loses its parent context.
  const filteredProjects = useMemo(() => {
    if (!data) return [];
    const { projectId, managerId, department, employeeStatus, projectStatus } = hierarchy.filters;
    return data.projects.filter((project) => {
      if (projectId && project.id !== projectId) return false;
      if (projectStatus && project.status !== projectStatus) return false;
      if (managerId && !project.managers.some((m) => m.userId === managerId)) return false;
      if (department && !project.assignments.some((a) => a.employee.department === department)) return false;
      if (employeeStatus && !project.assignments.some((a) => a.employee.status === employeeStatus)) return false;
      return true;
    });
  }, [data, hierarchy.filters]);

  function findAssignmentId(projectId: string, userId: string): string | undefined {
    return data?.projects.find((p) => p.id === projectId)?.assignments.find((a) => a.employee.userId === userId)?.assignmentId;
  }

  function projectActions(project: HierarchyProject): ActionMenuItem[] {
    return [
      { label: "View Project", icon: Eye, onClick: () => setDetailsTarget({ kind: "project", project }) },
      { label: "Assign Manager", icon: UserCog, onClick: () => setAssignManagerTarget(project), hidden: !canAssign },
      {
        label: "Assign Employee",
        icon: UserPlus,
        onClick: () => setAssignEmployeeTarget({ manager: null, projectOptions: [{ id: project.id, name: project.name }] }),
        hidden: !canAssign,
      },
      { label: "Edit Project", icon: Pencil, onClick: () => setEditProjectTarget(project), hidden: !canEditProject },
    ];
  }

  function managerActions(manager: HierarchyEmployeeRef): ActionMenuItem[] {
    const context = data?.managerContexts.get(manager.userId);
    const ownProjects = context?.ownProjects ?? [];
    const projectOptions: AssignEmployeeProjectOption[] = ownProjects.map((op) => ({ id: op.projectId, name: op.projectName }));

    return [
      {
        label: "View Manager",
        icon: Eye,
        onClick: () => {
          setDetailsTarget({
            kind: "manager",
            manager,
            projectCount: ownProjects.length,
            employeeCount: ownProjects.reduce((sum, op) => sum + op.employees.length, 0),
          });
        },
      },
      { label: "Assign Project", icon: UserPlus, onClick: () => setGenericAssignOpen(true), hidden: !canAssign },
      {
        label: "Assign Employee",
        icon: UserPlus,
        onClick: () => setAssignEmployeeTarget({ manager, projectOptions }),
        hidden: !canAssign || projectOptions.length === 0,
      },
      {
        label: "Change Manager",
        icon: Repeat,
        onClick: () =>
          showToast("Changing a reporting line isn't supported by the API yet — update it during onboarding instead.", "info"),
      },
    ];
  }

  function employeeActionsFor(employee: HierarchyEmployeeRef, projectId?: string): ActionMenuItem[] {
    const assignmentId = projectId ? findAssignmentId(projectId, employee.userId) : undefined;
    return [
      { label: "View Employee", icon: Eye, onClick: () => setDetailsTarget({ kind: "employee", employee, projectName: getProjectName(projectId) }) },
      { label: "Assign Project", icon: UserPlus, onClick: () => setGenericAssignOpen(true), hidden: !canAssign },
      {
        label: "Change Manager",
        icon: Repeat,
        onClick: () =>
          showToast("Changing a reporting line isn't supported by the API yet — update it during onboarding instead.", "info"),
      },
      {
        label: "Remove Assignment",
        icon: Trash2,
        tone: "danger",
        hidden: !canRemoveAssignment || !assignmentId,
        onClick: () => assignmentId && setRemoveTarget({ assignmentId, label: `${employee.name} from this project` }),
      },
    ];
  }

  function getProjectName(projectId?: string) {
    return projectId ? data?.projects.find((p) => p.id === projectId)?.name : undefined;
  }

  async function handleAssignManager(managerUserId: string) {
    if (!assignManagerTarget) return;
    setIsSubmitting(true);
    try {
      await assignProject({ userId: managerUserId, projectId: assignManagerTarget.id });
      showToast("Manager assigned.");
      setAssignManagerTarget(null);
      reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not assign this manager.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAssignEmployee({ employeeUserId, projectId }: { employeeUserId: string; projectId: string }) {
    setIsSubmitting(true);
    try {
      await assignProject({ userId: employeeUserId, projectId });
      showToast("Employee assigned.");
      setAssignEmployeeTarget(null);
      reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not assign this employee.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGenericAssign(params: { userId: string; projectId: string }) {
    try {
      await assignProject(params);
      showToast("Assigned successfully.");
      setGenericAssignOpen(false);
      reload();
      return true;
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not complete this assignment.", "error");
      return false;
    }
  }

  async function handleEditProject(id: string, payload: Parameters<typeof updateProject>[1]) {
    setIsSubmitting(true);
    try {
      await updateProject(id, payload);
      showToast("Project updated.");
      setEditProjectTarget(null);
      reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update this project.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemoveAssignment() {
    if (!removeTarget) return;
    setIsSubmitting(true);
    try {
      await unassignProject(removeTarget.assignmentId);
      showToast("Assignment removed.");
      setRemoveTarget(null);
      reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not remove this assignment.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  const managerCandidates = (project: HierarchyProject) => {
    if (!data) return [];
    const assignedIds = new Set(project.assignments.map((a) => a.employee.userId));
    return [...data.employeesById.values()].filter((e) => isManager(e) && !assignedIds.has(e.userId));
  };

  const employeeCandidatesForProject = (projectId: string) => {
    if (!data) return [];
    const project = data.projects.find((p) => p.id === projectId);
    if (!project) return [];
    const assignedIds = new Set(project.assignments.map((a) => a.employee.userId));
    return [...data.employeesById.values()].filter((e) => !assignedIds.has(e.userId));
  };

  return (
    <div>
      <PageHeader title="Project & Team Hierarchy" description="Admin → Project → Manager → Project → Employees, all in one view." />

      {!canViewHierarchy ? (
        <AccessRestricted moduleLabel="Project & Team Hierarchy" role={viewAsRole} />
      ) : isLoading ? (
        <div className="flex items-center justify-center gap-2 py-24 text-muted">
          <Spinner />
          Loading project hierarchy…
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface-card px-6 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-danger-bg text-danger">
            <AlertTriangle className="size-7" />
          </span>
          <h2 className="text-fs-2xl font-semibold text-ink">Unable to load project hierarchy.</h2>
          <p className="max-w-md text-fs-base text-muted">{error}</p>
          <Button onClick={reload}>Retry</Button>
        </div>
      ) : !data || data.projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface-card px-6 py-16 text-center">
          <h2 className="text-fs-2xl font-semibold text-ink">No projects found</h2>
          <p className="max-w-md text-fs-base text-muted">Create a project to start building your team hierarchy.</p>
          <Link href="/projects" className={buttonVariants({ variant: "primary" })}>
            Go to Projects
          </Link>
        </div>
      ) : (
        <>
          <HierarchySummaryCards summary={data.summary} />

          <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <HierarchySearch value={hierarchy.search} onChange={hierarchy.setSearch} results={hierarchy.searchResults} onSelect={hierarchy.goToResult} />
            <div className="hidden md:block">
              <HierarchyToolbar
                onZoomIn={() => treeRef.current?.zoomIn()}
                onZoomOut={() => treeRef.current?.zoomOut()}
                onFit={() => treeRef.current?.fit()}
                onReset={() => treeRef.current?.reset()}
                onExpandAll={hierarchy.expandAll}
                onCollapseAll={hierarchy.collapseAll}
              />
            </div>
          </div>

          <div className="mb-4">
            <HierarchyFilters data={data} value={hierarchy.filters} onChange={hierarchy.setFilters} />
          </div>

          {filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface-card px-6 py-16 text-center">
              <p className="text-fs-lg font-medium text-ink">No projects match these filters.</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <HierarchyTree
                  ref={treeRef}
                  data={data}
                  projects={filteredProjects}
                  expanded={hierarchy.expanded}
                  onToggle={hierarchy.toggle}
                  highlightKey={hierarchy.highlightKey}
                  onOpenAdmin={() => setDetailsTarget({ kind: "admin", summary: data.summary })}
                  onOpenProject={(project) => setDetailsTarget({ kind: "project", project })}
                  onOpenManager={(manager) =>
                    setDetailsTarget({
                      kind: "manager",
                      manager,
                      projectCount: data.managerContexts.get(manager.userId)?.ownProjects.length ?? 0,
                      employeeCount: data.managerContexts.get(manager.userId)?.ownProjects.reduce((sum, op) => sum + op.employees.length, 0) ?? 0,
                    })
                  }
                  onOpenEmployee={(employee) => setDetailsTarget({ kind: "employee", employee })}
                  onViewEmployees={(title, employees) => setEmployeeDrawer({ title, employees })}
                  projectActions={projectActions}
                  managerActions={managerActions}
                  employeeActions={employeeActionsFor}
                />
              </div>
              <div className="md:hidden">
                <HierarchyMobileView
                  data={data}
                  projects={filteredProjects}
                  onOpenProject={(project) => setDetailsTarget({ kind: "project", project })}
                  onOpenManager={(manager) =>
                    setDetailsTarget({
                      kind: "manager",
                      manager,
                      projectCount: data.managerContexts.get(manager.userId)?.ownProjects.length ?? 0,
                      employeeCount: data.managerContexts.get(manager.userId)?.ownProjects.reduce((sum, op) => sum + op.employees.length, 0) ?? 0,
                    })
                  }
                  onOpenEmployee={(employee) => setDetailsTarget({ kind: "employee", employee })}
                  projectActions={projectActions}
                  managerActions={managerActions}
                  employeeActions={employeeActionsFor}
                />
              </div>
            </>
          )}
        </>
      )}

      <NodeDetailsDrawer target={detailsTarget} onClose={() => setDetailsTarget(null)} />

      <EmployeeDrawer
        open={Boolean(employeeDrawer)}
        onClose={() => setEmployeeDrawer(null)}
        title={employeeDrawer?.title ?? ""}
        employees={employeeDrawer?.employees ?? []}
        onOpenEmployee={(employee) => setDetailsTarget({ kind: "employee", employee })}
      />

      <AssignManagerModal
        open={Boolean(assignManagerTarget)}
        onClose={() => setAssignManagerTarget(null)}
        project={assignManagerTarget}
        candidates={assignManagerTarget ? managerCandidates(assignManagerTarget) : []}
        onSubmit={handleAssignManager}
        isSubmitting={isSubmitting}
      />

      <AssignEmployeeModal
        open={Boolean(assignEmployeeTarget)}
        onClose={() => setAssignEmployeeTarget(null)}
        manager={assignEmployeeTarget?.manager}
        projectOptions={assignEmployeeTarget?.projectOptions ?? []}
        getCandidates={employeeCandidatesForProject}
        onSubmit={handleAssignEmployee}
        isSubmitting={isSubmitting}
      />

      {genericAssignOpen && <AssignProjectModal onClose={() => setGenericAssignOpen(false)} onAssign={handleGenericAssign} />}

      <ProjectFormModal
        open={Boolean(editProjectTarget)}
        onClose={() => setEditProjectTarget(null)}
        project={editProjectTarget ?? undefined}
        onCreate={async (payload) => {
          await createProject(payload);
          reload();
        }}
        onUpdate={handleEditProject}
        isSubmitting={isSubmitting}
      />

      <ConfirmModal
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemoveAssignment}
        title="Remove this assignment?"
        description={removeTarget?.label}
        body="This can't be undone."
        confirmLabel="Remove"
        isConfirming={isSubmitting}
      />
    </div>
  );
}
