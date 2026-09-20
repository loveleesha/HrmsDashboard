import { Avatar } from "@/components/atoms/Avatar";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { ActionMenu, type ActionMenuItem } from "@/components/molecules/ActionMenu";
import { EMPLOYMENT_STATUS_LABELS } from "@/types/employee";
import { cn } from "@/lib/cn";
import type { HierarchyEmployeeRef } from "@/types/hierarchy";

export interface EmployeeNodeProps {
  employee: HierarchyEmployeeRef;
  onOpenDetails: () => void;
  actions?: ActionMenuItem[];
  highlighted?: boolean;
}

export function EmployeeNode({ employee, onOpenDetails, actions, highlighted }: EmployeeNodeProps) {
  return (
    <div
      className={cn(
        "flex w-64 items-center gap-2.5 rounded-xl border bg-surface-card p-3 shadow-sm transition-shadow hover:shadow-md",
        highlighted ? "border-primary ring-2 ring-primary/30" : "border-border"
      )}
    >
      <Avatar name={employee.name} imageUrl={employee.avatarUrl} size="sm" />
      <button type="button" onClick={onOpenDetails} className="min-w-0 flex-1 text-left">
        <p className="truncate text-fs-base font-medium text-ink">{employee.name}</p>
        <p className="truncate text-fs-sm text-muted-light">
          {employee.employeeId ?? "—"}
          {employee.designation ? ` · ${employee.designation}` : ""}
        </p>
        <div className="mt-1">
          <StatusBadge status={EMPLOYMENT_STATUS_LABELS[employee.status]} />
        </div>
      </button>
      {actions && actions.length > 0 && <ActionMenu items={actions} ariaLabel={`${employee.name} actions`} />}
    </div>
  );
}
