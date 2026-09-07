"use client";

import { useEffect, useMemo, useState } from "react";
import { UserX } from "lucide-react";
import { Spinner } from "@/components/atoms/Spinner";
import { Button } from "@/components/atoms/Button";
import { EmployeeCard } from "@/components/organisms/employees/EmployeeCard";
import { TopPerformers } from "@/components/organisms/employees/TopPerformers";
import {
  EmployeeFiltersBar,
  type EmployeeFiltersState,
} from "@/components/organisms/employees/EmployeeFiltersBar";
import { EmployeeProfileDrawer } from "@/components/organisms/employees/EmployeeProfileDrawer";
import { getEmployees } from "@/services/employee.service";
import type { Employee } from "@/types/employee";

const DEFAULT_FILTERS: EmployeeFiltersState = {
  search: "",
  department: "",
  level: "",
  status: "",
  location: "",
  sort: "performance-desc",
};

export function EmployeeDirectory() {
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [filters, setFilters] = useState<EmployeeFiltersState>(DEFAULT_FILTERS);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    let isMounted = true;
    getEmployees().then((result) => {
      if (isMounted) setEmployees(result);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const rankMap = useMemo(() => {
    if (!employees) return new Map<string, number>();
    const sorted = [...employees].sort((a, b) => b.performanceScore - a.performanceScore);
    return new Map(sorted.map((employee, index) => [employee.id, index + 1]));
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    if (!employees) return [];

    const query = filters.search.trim().toLowerCase();

    const result = employees.filter((employee) => {
      const matchesQuery =
        !query ||
        employee.name.toLowerCase().includes(query) ||
        employee.id.toLowerCase().includes(query) ||
        employee.designation.toLowerCase().includes(query) ||
        employee.department.toLowerCase().includes(query) ||
        employee.skills.some((skill) => skill.toLowerCase().includes(query));

      const matchesDepartment = !filters.department || employee.department === filters.department;
      const matchesLevel = !filters.level || employee.level === filters.level;
      const matchesStatus = !filters.status || employee.status === filters.status;
      const matchesLocation = !filters.location || employee.workLocationType === filters.location;

      return matchesQuery && matchesDepartment && matchesLevel && matchesStatus && matchesLocation;
    });

    const sorted = [...result].sort((a, b) => {
      switch (filters.sort) {
        case "performance-desc":
          return b.performanceScore - a.performanceScore;
        case "performance-asc":
          return a.performanceScore - b.performanceScore;
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "department":
          return a.department.localeCompare(b.department) || a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return sorted;
  }, [employees, filters]);

  const hasActiveFilters = Boolean(
    filters.search || filters.department || filters.level || filters.status || filters.location
  );

  if (!employees) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted">
        <Spinner />
        Loading employees…
      </div>
    );
  }

  return (
    <div>
      <TopPerformers employees={employees} />

      <EmployeeFiltersBar
        filters={filters}
        onChange={setFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <p className="mb-3 text-fs-base text-muted">
        {filteredEmployees.length} {filteredEmployees.length === 1 ? "employee" : "employees"} found
      </p>

      {filteredEmployees.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface-card px-6 py-20 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary">
            <UserX className="size-7" />
          </span>
          <h2 className="text-fs-4xl font-semibold text-ink">No employees found</h2>
          <p className="max-w-md text-fs-lg text-muted">
            Try searching with a different name, role or department.
          </p>
          {hasActiveFilters && (
            <Button variant="secondary" size="sm" onClick={() => setFilters(DEFAULT_FILTERS)}>
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEmployees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              rank={rankMap.get(employee.id)}
              onViewProfile={setSelectedEmployee}
            />
          ))}
        </div>
      )}

      <EmployeeProfileDrawer employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />
    </div>
  );
}
