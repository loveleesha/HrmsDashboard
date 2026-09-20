import { Users } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { EmployeeNode } from "@/components/organisms/hierarchy/EmployeeNode";
import type { ActionMenuItem } from "@/components/molecules/ActionMenu";
import type { HierarchyEmployeeRef } from "@/types/hierarchy";

const INLINE_THRESHOLD = 6;

export interface EmployeeGroupProps {
  employees: HierarchyEmployeeRef[];
  onOpenEmployee: (employee: HierarchyEmployeeRef) => void;
  onViewAll: () => void;
  employeeActions: (employee: HierarchyEmployeeRef) => ActionMenuItem[];
  highlightedUserId?: string | null;
}

/** Renders small teams inline; large ones collapse to a summary + "View
 * Employees" button instead of rendering every card (the large-team
 * handling requirement — never render hundreds of nodes in the tree). */
export function EmployeeGroup({ employees, onOpenEmployee, onViewAll, employeeActions, highlightedUserId }: EmployeeGroupProps) {
  if (employees.length === 0) {
    return <p className="w-64 py-2 text-fs-sm text-muted-light">No employees on this project yet.</p>;
  }

  if (employees.length <= INLINE_THRESHOLD) {
    return (
      <div className="flex flex-col gap-2">
        {employees.map((employee) => (
          <EmployeeNode
            key={employee.userId}
            employee={employee}
            onOpenDetails={() => onOpenEmployee(employee)}
            actions={employeeActions(employee)}
            highlighted={highlightedUserId === employee.userId}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex w-64 flex-col items-center gap-2 rounded-xl border border-dashed border-border-strong bg-surface p-4 text-center">
      <Users className="size-5 text-muted-light" />
      <p className="text-fs-base font-medium text-ink">{employees.length} Employees</p>
      <Button size="sm" variant="secondary" onClick={onViewAll}>
        View Employees
      </Button>
    </div>
  );
}
