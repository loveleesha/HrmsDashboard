import { ChevronDown, ChevronRight, FolderKanban } from "lucide-react";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { ActionMenu, type ActionMenuItem } from "@/components/molecules/ActionMenu";
import { cn } from "@/lib/cn";
import type { HierarchyProject } from "@/types/hierarchy";

export interface ProjectNodeProps {
  project: HierarchyProject;
  employeeCount: number;
  expanded: boolean;
  onToggle: () => void;
  onOpenDetails: () => void;
  actions: ActionMenuItem[];
  highlighted?: boolean;
}

export function ProjectNode({ project, employeeCount, expanded, onToggle, onOpenDetails, actions, highlighted }: ProjectNodeProps) {
  const hasChildren = project.assignments.length > 0;

  return (
    <div
      className={cn(
        "flex w-64 flex-col gap-2 rounded-xl border bg-surface-card p-4 shadow-sm transition-shadow hover:shadow-md",
        highlighted ? "border-primary ring-2 ring-primary/30" : "border-border"
      )}
    >
      <div className="flex items-start gap-2.5">
        {hasChildren && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={expanded ? "Collapse" : "Expand"}
            className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded text-muted hover:bg-surface"
          >
            {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        )}
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg bg-info-bg text-info", !hasChildren && "ml-[26px]")}>
          <FolderKanban className="size-5" />
        </span>
        <button type="button" onClick={onOpenDetails} className="min-w-0 flex-1 text-left">
          <p className="truncate text-fs-lg font-semibold text-ink">{project.name}</p>
          <p className="truncate text-fs-sm text-muted-light">PRJ-{project.id.slice(-6).toUpperCase()}</p>
        </button>
        <ActionMenu items={actions} ariaLabel={`${project.name} actions`} />
      </div>
      <div className="flex items-center justify-between border-t border-border pt-2">
        <StatusBadge status={project.status === "active" ? "Active" : "Inactive"} />
        <p className="text-fs-sm text-muted">
          {project.managers.length} Managers · {employeeCount} Employees
        </p>
      </div>
    </div>
  );
}
