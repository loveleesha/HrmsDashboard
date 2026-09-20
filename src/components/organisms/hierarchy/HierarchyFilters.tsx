import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { isManager } from "@/services/hierarchy.service";
import { EMPLOYMENT_STATUS_LABELS, EMPLOYMENT_STATUSES } from "@/types/employee";
import type { HierarchyFilters as HierarchyFiltersValue } from "@/hooks/use-hierarchy";
import type { HierarchyData } from "@/types/hierarchy";

export interface HierarchyFiltersProps {
  data: HierarchyData;
  value: HierarchyFiltersValue;
  onChange: (value: HierarchyFiltersValue) => void;
}

export function HierarchyFilters({ data, value, onChange }: HierarchyFiltersProps) {
  const departments = [...new Set([...data.employeesById.values()].map((e) => e.department).filter(Boolean))].sort();
  const managers = [...data.employeesById.values()].filter(isManager).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterDropdown
        label="All Projects"
        options={data.projects.map((p) => ({ label: p.name, value: p.id }))}
        value={value.projectId}
        onChange={(v) => onChange({ ...value, projectId: v })}
        className="w-full sm:w-48"
      />
      <FilterDropdown
        label="All Managers"
        options={managers.map((m) => ({ label: m.name, value: m.userId }))}
        value={value.managerId}
        onChange={(v) => onChange({ ...value, managerId: v })}
        className="w-full sm:w-48"
      />
      <FilterDropdown
        label="All Departments"
        options={departments.map((d) => ({ label: d, value: d }))}
        value={value.department}
        onChange={(v) => onChange({ ...value, department: v })}
        className="w-full sm:w-44"
      />
      <FilterDropdown
        label="Employee Status"
        options={EMPLOYMENT_STATUSES.map((s) => ({ label: EMPLOYMENT_STATUS_LABELS[s], value: s }))}
        value={value.employeeStatus}
        onChange={(v) => onChange({ ...value, employeeStatus: v })}
        className="w-full sm:w-44"
      />
      <FilterDropdown
        label="Project Status"
        options={[
          { label: "Active", value: "active" },
          { label: "Inactive", value: "inactive" },
        ]}
        value={value.projectStatus}
        onChange={(v) => onChange({ ...value, projectStatus: v })}
        className="w-full sm:w-40"
      />
    </div>
  );
}
