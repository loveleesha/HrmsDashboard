"use client";

import { ListFilter } from "lucide-react";
import { FormField } from "@/components/molecules/FormField";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { DatePickerField } from "@/components/molecules/DatePickerField";
import { todayKey } from "@/lib/validation";

export interface DsrFilters {
  fromDate: string;
  toDate: string;
  project: string;
}

export const EMPTY_DSR_FILTERS: DsrFilters = { fromDate: "", toDate: "", project: "" };

/** `projectOptions` are the project labels actually present in the loaded entries. */
export function DsrFilterBar({
  filters,
  onChange,
  projectOptions,
}: {
  filters: DsrFilters;
  onChange: (filters: DsrFilters) => void;
  projectOptions: string[];
}) {
  function update<K extends keyof DsrFilters>(key: K, value: DsrFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  // The range must stay valid: picking a From after the current To moves To along with it.
  function updateFrom(value: string) {
    onChange({ ...filters, fromDate: value, toDate: filters.toDate && value && filters.toDate < value ? value : filters.toDate });
  }

  return (
    <div className="mb-4 rounded-xl border border-border bg-surface-card p-4">
      <div className="mb-3 flex items-center gap-2 text-fs-base font-semibold text-ink">
        <ListFilter className="size-4 text-primary" />
        Filter Worksheets
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <DatePickerField
          label="From Date"
          value={filters.fromDate}
          max={filters.toDate || todayKey()}
          clearable
          placeholder="Any"
          onChange={(e) => updateFrom(e.target.value)}
        />
        <DatePickerField
          label="To Date"
          value={filters.toDate}
          min={filters.fromDate || undefined}
          max={todayKey()}
          clearable
          placeholder="Any"
          onChange={(e) => update("toDate", e.target.value)}
        />
        <FormField label="Project" htmlFor="dsr-filter-project">
          <FilterDropdown
            label="All projects"
            ariaLabel="Filter by project"
            options={projectOptions.map((p) => ({ label: p, value: p }))}
            value={filters.project}
            onChange={(v) => update("project", v)}
          />
        </FormField>
      </div>
    </div>
  );
}
