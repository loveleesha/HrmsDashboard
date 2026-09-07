import { X } from "lucide-react";
import { SearchInput } from "@/components/molecules/SearchInput";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { Button } from "@/components/atoms/Button";
import {
  DEPARTMENTS,
  DESIGNATION_LEVELS,
  EMPLOYMENT_STATUSES,
  WORK_LOCATION_TYPES,
} from "@/types/employee";

export type SortOption =
  | "performance-desc"
  | "performance-asc"
  | "name-asc"
  | "name-desc"
  | "department";

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Performance: High → Low", value: "performance-desc" },
  { label: "Performance: Low → High", value: "performance-asc" },
  { label: "Name: A → Z", value: "name-asc" },
  { label: "Name: Z → A", value: "name-desc" },
  { label: "Department", value: "department" },
];

export interface EmployeeFiltersState {
  search: string;
  department: string;
  level: string;
  status: string;
  location: string;
  sort: SortOption;
}

export interface EmployeeFiltersBarProps {
  filters: EmployeeFiltersState;
  onChange: (filters: EmployeeFiltersState) => void;
  hasActiveFilters: boolean;
}

export function EmployeeFiltersBar({ filters, onChange, hasActiveFilters }: EmployeeFiltersBarProps) {
  function update<K extends keyof EmployeeFiltersState>(key: K, value: EmployeeFiltersState[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-surface-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput
          placeholder="Search employees, departments, roles…"
          value={filters.search}
          onChange={(event) => update("search", event.target.value)}
          className="sm:flex-1"
        />
        <FilterDropdown
          label="Sort by"
          options={SORT_OPTIONS}
          value={filters.sort}
          onChange={(value) => update("sort", value as SortOption)}
          className="sm:w-56"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterDropdown
          label="Department"
          options={DEPARTMENTS.map((d) => ({ label: d, value: d }))}
          value={filters.department}
          onChange={(value) => update("department", value)}
          className="w-[calc(50%-4px)] sm:w-40"
        />
        <FilterDropdown
          label="Designation"
          options={DESIGNATION_LEVELS.map((d) => ({ label: d, value: d }))}
          value={filters.level}
          onChange={(value) => update("level", value)}
          className="w-[calc(50%-4px)] sm:w-40"
        />
        <FilterDropdown
          label="Status"
          options={EMPLOYMENT_STATUSES.map((s) => ({ label: s, value: s }))}
          value={filters.status}
          onChange={(value) => update("status", value)}
          className="w-[calc(50%-4px)] sm:w-40"
        />
        <FilterDropdown
          label="Location"
          options={WORK_LOCATION_TYPES.map((l) => ({ label: l, value: l }))}
          value={filters.location}
          onChange={(value) => update("location", value)}
          className="w-[calc(50%-4px)] sm:w-40"
        />
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onChange({
                search: "",
                department: "",
                level: "",
                status: "",
                location: "",
                sort: filters.sort,
              })
            }
          >
            <X className="size-3.5" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}
