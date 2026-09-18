"use client";

import { ListFilter, RotateCcw } from "lucide-react";
import { FormField } from "@/components/molecules/FormField";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { DSR_STATUSES } from "@/types/dsr";
import { useActiveProjects } from "@/hooks/use-active-projects";

export interface DsrFilters {
  fromDate: string;
  toDate: string;
  status: string;
  project: string;
}

export const EMPTY_DSR_FILTERS: DsrFilters = { fromDate: "", toDate: "", status: "", project: "" };

export function DsrFilterBar({
  filters,
  onChange,
}: {
  filters: DsrFilters;
  onChange: (filters: DsrFilters) => void;
}) {
  const projects = useActiveProjects();

  function update<K extends keyof DsrFilters>(key: K, value: DsrFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="mb-4 rounded-xl border border-border bg-surface-card p-4">
      <div className="mb-3 flex items-center gap-2 text-fs-base font-semibold text-ink">
        <ListFilter className="size-4 text-primary" />
        Filter Worksheets
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <FormField label="From Date" htmlFor="dsr-from">
          <Input id="dsr-from" type="date" value={filters.fromDate} onChange={(e) => update("fromDate", e.target.value)} />
        </FormField>
        <FormField label="End Date" htmlFor="dsr-to">
          <Input id="dsr-to" type="date" value={filters.toDate} onChange={(e) => update("toDate", e.target.value)} />
        </FormField>
        <FormField label="Status" htmlFor="dsr-status">
          <FilterDropdown
            label="All"
            ariaLabel="Status"
            options={DSR_STATUSES.map((s) => ({ label: s, value: s }))}
            value={filters.status}
            onChange={(v) => update("status", v)}
          />
        </FormField>
        <FormField label="Project" htmlFor="dsr-filter-project">
          <FilterDropdown
            label="All"
            ariaLabel="Filter by project"
            options={projects.map((p) => ({ label: p.name, value: p.name }))}
            value={filters.project}
            onChange={(v) => update("project", v)}
          />
        </FormField>
        <div className="flex items-end">
          <Button variant="secondary" size="sm" className="w-full" onClick={() => onChange(EMPTY_DSR_FILTERS)}>
            <RotateCcw className="size-3.5" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
