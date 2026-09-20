import { ChevronDown, ChevronRight } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { ActionMenu, type ActionMenuItem } from "@/components/molecules/ActionMenu";
import { cn } from "@/lib/cn";
import type { HierarchyEmployeeRef } from "@/types/hierarchy";

export interface ManagerNodeProps {
  manager: HierarchyEmployeeRef;
  projectCount: number;
  employeeCount: number;
  expanded: boolean;
  onToggle: () => void;
  onOpenDetails: () => void;
  actions: ActionMenuItem[];
  highlighted?: boolean;
}

export function ManagerNode({ manager, projectCount, employeeCount, expanded, onToggle, onOpenDetails, actions, highlighted }: ManagerNodeProps) {
  const hasChildren = projectCount > 0;

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
        <div className={cn(!hasChildren && "ml-[26px]")}>
          <Avatar name={manager.name} imageUrl={manager.avatarUrl} size="sm" />
        </div>
        <button type="button" onClick={onOpenDetails} className="min-w-0 flex-1 text-left">
          <p className="truncate text-fs-lg font-semibold text-ink">{manager.name}</p>
          <p className="truncate text-fs-sm text-muted-light">{manager.designation || "Manager"}</p>
        </button>
        <ActionMenu items={actions} ariaLabel={`${manager.name} actions`} />
      </div>
      <div className="border-t border-border pt-2 text-fs-sm text-muted">
        {projectCount} Projects · {employeeCount} Employees
      </div>
    </div>
  );
}
