"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { ActionMenuItem } from "@/components/molecules/ActionMenu";
import { AdminNode } from "@/components/organisms/hierarchy/AdminNode";
import { ProjectNode } from "@/components/organisms/hierarchy/ProjectNode";
import { ManagerNode } from "@/components/organisms/hierarchy/ManagerNode";
import { EmployeeGroup } from "@/components/organisms/hierarchy/EmployeeGroup";
import { managerKey, managerProjectKey, projectKey } from "@/hooks/use-hierarchy";
import { cn } from "@/lib/cn";
import type { HierarchyData, HierarchyEmployeeRef, HierarchyProject } from "@/types/hierarchy";

export interface HierarchyTreeHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  fit: () => void;
}

export interface HierarchyTreeProps {
  data: HierarchyData;
  projects: HierarchyProject[];
  expanded: Set<string>;
  onToggle: (key: string) => void;
  highlightKey: string | null;
  onOpenAdmin: () => void;
  onOpenProject: (project: HierarchyProject) => void;
  onOpenManager: (manager: HierarchyEmployeeRef, topProjectId: string) => void;
  onOpenEmployee: (employee: HierarchyEmployeeRef) => void;
  onViewEmployees: (title: string, employees: HierarchyEmployeeRef[]) => void;
  projectActions: (project: HierarchyProject) => ActionMenuItem[];
  managerActions: (manager: HierarchyEmployeeRef, topProjectId: string) => ActionMenuItem[];
  employeeActions: (employee: HierarchyEmployeeRef, projectId: string) => ActionMenuItem[];
}

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 1.5;
const ZOOM_STEP = 0.1;

const Connector = () => <span className="absolute -left-8 top-7 h-px w-8 bg-border-strong" aria-hidden="true" />;

export const HierarchyTree = forwardRef<HierarchyTreeHandle, HierarchyTreeProps>(function HierarchyTree(
  {
    data,
    projects,
    expanded,
    onToggle,
    highlightKey,
    onOpenAdmin,
    onOpenProject,
    onOpenManager,
    onOpenEmployee,
    onViewEmployees,
    projectActions,
    managerActions,
    employeeActions,
  },
  ref
) {
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<string, HTMLDivElement>());

  useEffect(() => {
    if (!highlightKey) return;
    const node = nodeRefs.current.get(highlightKey);
    node?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
  }, [highlightKey]);

  function registerNode(key: string) {
    return (el: HTMLDivElement | null) => {
      if (el) nodeRefs.current.set(key, el);
      else nodeRefs.current.delete(key);
    };
  }

  useImperativeHandle(ref, () => ({
    zoomIn: () => setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2))),
    zoomOut: () => setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2))),
    reset: () => {
      setZoom(1);
      containerRef.current?.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    },
    fit: () => {
      const container = containerRef.current;
      const content = contentRef.current;
      if (!container || !content) return;
      const scaleX = (container.clientWidth - 32) / (content.scrollWidth / zoom);
      const scaleY = (container.clientHeight - 32) / (content.scrollHeight / zoom);
      setZoom(Math.max(MIN_ZOOM, Math.min(1, scaleX, scaleY)));
    },
  }));

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, +(z - event.deltaY * 0.001).toFixed(2))));
  }

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      className="relative h-[calc(100vh-380px)] min-h-[420px] overflow-auto rounded-xl border border-border bg-surface"
    >
      <div ref={contentRef} className="inline-block p-10" style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}>
        <div className="flex items-start gap-8">
          <AdminNode summary={data.summary} onOpenDetails={onOpenAdmin} />

          {projects.length > 0 && (
            <div className="relative flex flex-col gap-6 border-l-2 border-border pl-8">
              {projects.map((project) => {
                const pKey = projectKey(project.id);
                const isExpanded = expanded.has(pKey);
                const employeeCount = project.assignments.length;

                return (
                  <div key={project.id} ref={registerNode(pKey)} className="relative">
                    <Connector />
                    <ProjectNode
                      project={project}
                      employeeCount={employeeCount}
                      expanded={isExpanded}
                      onToggle={() => onToggle(pKey)}
                      onOpenDetails={() => onOpenProject(project)}
                      actions={projectActions(project)}
                      highlighted={highlightKey === pKey}
                    />

                    {isExpanded && project.managers.length > 0 && (
                      <div className="relative mt-4 flex flex-col gap-4 border-l-2 border-border pl-8">
                        {project.managers.map((manager) => {
                          const mKey = managerKey(project.id, manager.userId);
                          const managerExpanded = expanded.has(mKey);
                          const context = data.managerContexts.get(manager.userId);
                          const ownProjects = context?.ownProjects ?? [];
                          const totalReports = ownProjects.reduce((sum, op) => sum + op.employees.length, 0);

                          return (
                            <div key={manager.userId} ref={registerNode(mKey)} className="relative">
                              <Connector />
                              <ManagerNode
                                manager={manager}
                                projectCount={ownProjects.length}
                                employeeCount={totalReports}
                                expanded={managerExpanded}
                                onToggle={() => onToggle(mKey)}
                                onOpenDetails={() => onOpenManager(manager, project.id)}
                                actions={managerActions(manager, project.id)}
                                highlighted={highlightKey === mKey}
                              />

                              {managerExpanded && ownProjects.length > 0 && (
                                <div className="relative mt-4 flex flex-col gap-4 border-l-2 border-border pl-8">
                                  {ownProjects.map((ownProject) => {
                                    const opKey = managerProjectKey(project.id, manager.userId, ownProject.projectId);
                                    return (
                                      <div key={ownProject.projectId} ref={registerNode(opKey)} className="relative">
                                        <Connector />
                                        <div
                                          className={cn(
                                            "mb-2 w-64 rounded-lg border border-dashed border-border-strong bg-surface px-3 py-2",
                                            highlightKey === opKey && "border-primary ring-2 ring-primary/30"
                                          )}
                                        >
                                          <p className="truncate text-fs-base font-medium text-ink">{ownProject.projectName}</p>
                                          <p className="text-fs-sm text-muted-light">{ownProject.employees.length} Employees</p>
                                        </div>
                                        <EmployeeGroup
                                          employees={ownProject.employees}
                                          onOpenEmployee={onOpenEmployee}
                                          onViewAll={() => onViewEmployees(`${manager.name} · ${ownProject.projectName}`, ownProject.employees)}
                                          employeeActions={(employee) => employeeActions(employee, ownProject.projectId)}
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
