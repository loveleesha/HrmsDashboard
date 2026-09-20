"use client";

import { useMemo, useState } from "react";
import { Drawer } from "@/components/molecules/Drawer";
import { SearchInput } from "@/components/molecules/SearchInput";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { Pagination } from "@/components/molecules/Pagination";
import { Avatar } from "@/components/atoms/Avatar";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { EMPLOYMENT_STATUS_LABELS, EMPLOYMENT_STATUSES } from "@/types/employee";
import type { HierarchyEmployeeRef } from "@/types/hierarchy";

const PAGE_SIZE = 10;

export interface EmployeeDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  employees: HierarchyEmployeeRef[];
  onOpenEmployee: (employee: HierarchyEmployeeRef) => void;
}

/** The large-team overflow drawer — search + department/status filter +
 * pagination, so a 150-employee team never renders as 150 inline cards. */
export function EmployeeDrawer({ open, onClose, title, employees, onOpenEmployee }: EmployeeDrawerProps) {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setSearch("");
      setDepartment("");
      setStatus("");
      setPage(1);
    }
  }

  const departments = useMemo(() => [...new Set(employees.map((e) => e.department).filter(Boolean))].sort(), [employees]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      if (q && !e.name.toLowerCase().includes(q) && !e.employeeId?.toLowerCase().includes(q)) return false;
      if (department && e.department !== department) return false;
      if (status && e.status !== status) return false;
      return true;
    });
  }, [employees, search, department, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <Drawer open={open} onClose={onClose} title="Employees" description={title} widthClassName="sm:max-w-lg">
      <div className="flex flex-col gap-3">
        <SearchInput
          placeholder="Search employees…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <div className="flex gap-2">
          <FilterDropdown
            label="Department"
            options={departments.map((d) => ({ label: d, value: d }))}
            value={department}
            onChange={(v) => {
              setDepartment(v);
              setPage(1);
            }}
            className="flex-1"
          />
          <FilterDropdown
            label="Status"
            options={EMPLOYMENT_STATUSES.map((s) => ({ label: EMPLOYMENT_STATUS_LABELS[s], value: s }))}
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            className="flex-1"
          />
        </div>

        {pageItems.length === 0 ? (
          <p className="py-12 text-center text-fs-base text-muted">No employees match this search.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {pageItems.map((employee) => (
              <button
                key={employee.userId}
                type="button"
                onClick={() => onOpenEmployee(employee)}
                className="flex items-center gap-3 rounded-lg border border-border p-2.5 text-left hover:bg-surface"
              >
                <Avatar name={employee.name} imageUrl={employee.avatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-fs-base font-medium text-ink">{employee.name}</p>
                  <p className="truncate text-fs-sm text-muted">
                    {employee.employeeId ?? "—"} {employee.designation && `· ${employee.designation}`}
                  </p>
                </div>
                <StatusBadge status={EMPLOYMENT_STATUS_LABELS[employee.status]} />
              </button>
            ))}
          </div>
        )}

        <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </Drawer>
  );
}
