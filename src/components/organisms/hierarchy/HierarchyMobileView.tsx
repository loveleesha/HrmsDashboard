"use client";

import { useState } from "react";
import { ChevronRight, FolderKanban, Users } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { ActionMenu, type ActionMenuItem } from "@/components/molecules/ActionMenu";
import { EMPLOYMENT_STATUS_LABELS } from "@/types/employee";
import type { HierarchyData, HierarchyEmployeeRef, HierarchyManagerProject, HierarchyProject } from "@/types/hierarchy";

type Level =
  | { kind: "projects" }
  | { kind: "managers"; project: HierarchyProject }
  | { kind: "managerProjects"; project: HierarchyProject; manager: HierarchyEmployeeRef }
  | { kind: "employees"; project: HierarchyProject; manager: HierarchyEmployeeRef; ownProject: HierarchyManagerProject };

export interface HierarchyMobileViewProps {
  data: HierarchyData;
  projects: HierarchyProject[];
  onOpenProject: (project: HierarchyProject) => void;
  onOpenManager: (manager: HierarchyEmployeeRef, topProjectId: string) => void;
  onOpenEmployee: (employee: HierarchyEmployeeRef) => void;
  projectActions: (project: HierarchyProject) => ActionMenuItem[];
  managerActions: (manager: HierarchyEmployeeRef, topProjectId: string) => ActionMenuItem[];
  employeeActions: (employee: HierarchyEmployeeRef, projectId: string) => ActionMenuItem[];
}

/** Nested drill-down for narrow viewports — one level per screen instead of
 * the desktop canvas tree, per the "don't squeeze the desktop tree onto
 * mobile" requirement. */
export function HierarchyMobileView({
  data,
  projects,
  onOpenProject,
  onOpenManager,
  onOpenEmployee,
  projectActions,
  managerActions,
  employeeActions,
}: HierarchyMobileViewProps) {
  const [stack, setStack] = useState<Level[]>([{ kind: "projects" }]);
  const current = stack[stack.length - 1];

  function push(level: Level) {
    setStack((prev) => [...prev, level]);
  }
  function jumpTo(index: number) {
    setStack((prev) => prev.slice(0, index + 1));
  }

  const breadcrumbLabels = stack.map((level) => {
    if (level.kind === "projects") return "Admin";
    if (level.kind === "managers") return level.project.name;
    if (level.kind === "managerProjects") return level.manager.name;
    return level.ownProject.projectName;
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1 text-fs-sm text-muted">
        {breadcrumbLabels.map((label, index) => (
          <span key={index} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="size-3 text-muted-light" />}
            <button
              type="button"
              onClick={() => jumpTo(index)}
              className={index === breadcrumbLabels.length - 1 ? "font-medium text-ink" : "hover:text-ink hover:underline"}
            >
              {label}
            </button>
          </span>
        ))}
      </div>

      {current.kind === "projects" && (
        <div className="flex flex-col gap-2">
          {projects.length === 0 && <p className="py-8 text-center text-fs-base text-muted">No projects found.</p>}
          {projects.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => (project.managers.length > 0 ? push({ kind: "managers", project }) : onOpenProject(project))}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface-card p-3.5 text-left"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-info-bg text-info">
                <FolderKanban className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-fs-base font-semibold text-ink">{project.name}</p>
                <p className="text-fs-sm text-muted">
                  {project.managers.length} Managers · {project.assignments.length} Employees
                </p>
              </div>
              <StatusBadge status={project.status === "active" ? "Active" : "Inactive"} />
              {project.managers.length > 0 && <ChevronRight className="size-4 shrink-0 text-muted-light" />}
              <ActionMenu items={projectActions(project)} ariaLabel={`${project.name} actions`} />
            </button>
          ))}
        </div>
      )}

      {current.kind === "managers" && (
        <div className="flex flex-col gap-2">
          <p className="text-fs-base font-semibold text-ink">Managers ({current.project.managers.length})</p>
          {current.project.managers.map((manager) => {
            const context = data.managerContexts.get(manager.userId);
            const ownProjects = context?.ownProjects ?? [];
            const totalReports = ownProjects.reduce((sum, op) => sum + op.employees.length, 0);
            return (
              <button
                key={manager.userId}
                type="button"
                onClick={() => (ownProjects.length > 0 ? push({ kind: "managerProjects", project: current.project, manager }) : onOpenManager(manager, current.project.id))}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface-card p-3.5 text-left"
              >
                <Avatar name={manager.name} imageUrl={manager.avatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-fs-base font-semibold text-ink">{manager.name}</p>
                  <p className="text-fs-sm text-muted">
                    {manager.designation || "Manager"} · {ownProjects.length} Projects · {totalReports} Employees
                  </p>
                </div>
                {ownProjects.length > 0 && <ChevronRight className="size-4 shrink-0 text-muted-light" />}
                <ActionMenu items={managerActions(manager, current.project.id)} ariaLabel={`${manager.name} actions`} />
              </button>
            );
          })}
        </div>
      )}

      {current.kind === "managerProjects" && (
        <div className="flex flex-col gap-2">
          <p className="text-fs-base font-semibold text-ink">{current.manager.name}&apos;s Projects</p>
          {current.manager && data.managerContexts.get(current.manager.userId)?.ownProjects.map((ownProject) => (
            <button
              key={ownProject.projectId}
              type="button"
              onClick={() => push({ kind: "employees", project: current.project, manager: current.manager, ownProject })}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface-card p-3.5 text-left"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-info-bg text-info">
                <FolderKanban className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-fs-base font-semibold text-ink">{ownProject.projectName}</p>
                <p className="text-fs-sm text-muted">{ownProject.employees.length} Employees</p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-light" />
            </button>
          ))}
        </div>
      )}

      {current.kind === "employees" && (
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-1.5 text-fs-base font-semibold text-ink">
            <Users className="size-4" />
            Employees ({current.ownProject.employees.length})
          </p>
          {current.ownProject.employees.length === 0 && <p className="py-8 text-center text-fs-base text-muted">No employees assigned yet.</p>}
          {current.ownProject.employees.map((employee) => (
            <button
              key={employee.userId}
              type="button"
              onClick={() => onOpenEmployee(employee)}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface-card p-3 text-left"
            >
              <Avatar name={employee.name} imageUrl={employee.avatarUrl} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-fs-base font-medium text-ink">{employee.name}</p>
                <p className="truncate text-fs-sm text-muted">
                  {employee.employeeId ?? "—"} {employee.designation && `· ${employee.designation}`}
                </p>
              </div>
              <StatusBadge status={EMPLOYMENT_STATUS_LABELS[employee.status]} />
              <ActionMenu items={employeeActions(employee, current.ownProject.projectId)} ariaLabel={`${employee.name} actions`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
