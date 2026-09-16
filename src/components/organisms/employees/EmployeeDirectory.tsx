"use client";

import { useEffect, useMemo, useState } from "react";
import { UserX } from "lucide-react";
import { Spinner } from "@/components/atoms/Spinner";
import { Button } from "@/components/atoms/Button";
import { EmployeeCard } from "@/components/organisms/employees/EmployeeCard";
import {
  EmployeeFiltersBar,
  type EmployeeFiltersState,
} from "@/components/organisms/employees/EmployeeFiltersBar";
import { EmployeeProfileDrawer } from "@/components/organisms/employees/EmployeeProfileDrawer";
import { useRBAC } from "@/hooks/use-rbac";
import { useToast } from "@/hooks/use-toast";
import { getEmployees, updateEmployeeStatus } from "@/services/employee.service";
import type { Employee } from "@/types/employee";

const DEFAULT_FILTERS: EmployeeFiltersState = {
  search: "",
  department: "",
  employmentType: "",
  status: "",
  location: "",
  sort: "name-asc",
};

export function EmployeeDirectory() {
  const { can } = useRBAC();
  const { showToast } = useToast();
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

  const locationOptions = useMemo(() => {
    const distinct = new Set((employees ?? []).map((e) => e.location).filter((l): l is string => Boolean(l)));
    return [...distinct].sort();
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    if (!employees) return [];

    const query = filters.search.trim().toLowerCase();

    const result = employees.filter((employee) => {
      const matchesQuery =
        !query ||
        employee.name.toLowerCase().includes(query) ||
        (employee.employeeId ?? "").toLowerCase().includes(query) ||
        employee.designation.toLowerCase().includes(query) ||
        employee.department.toLowerCase().includes(query) ||
        employee.skills.some((skill) => skill.toLowerCase().includes(query));

      const matchesDepartment = !filters.department || employee.department === filters.department;
      const matchesEmploymentType = !filters.employmentType || employee.employmentType === filters.employmentType;
      const matchesStatus = !filters.status || employee.status === filters.status;
      const matchesLocation = !filters.location || employee.location === filters.location;

      return matchesQuery && matchesDepartment && matchesEmploymentType && matchesStatus && matchesLocation;
    });

    const sorted = [...result].sort((a, b) => {
      switch (filters.sort) {
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
    filters.search || filters.department || filters.employmentType || filters.status || filters.location
  );

  async function handleUpdateStatus(employee: Employee, nextStatus: "active" | "inactive") {
    try {
      await updateEmployeeStatus(employee.id, nextStatus);
      setEmployees((prev) => prev?.map((e) => (e.id === employee.id ? { ...e, status: nextStatus } : e)) ?? prev);
      setSelectedEmployee((prev) => (prev && prev.id === employee.id ? { ...prev, status: nextStatus } : prev));
      showToast(`${employee.name} is now ${nextStatus === "active" ? "active" : "inactive"}.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update employee status.", "error");
      throw err;
    }
  }

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
      <EmployeeFiltersBar
        filters={filters}
        onChange={setFilters}
        hasActiveFilters={hasActiveFilters}
        locationOptions={locationOptions}
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
            {employees.length === 0
              ? "Onboarded employees will show up here."
              : "Try searching with a different name, role or department."}
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
            <EmployeeCard key={employee.id} employee={employee} onViewProfile={setSelectedEmployee} />
          ))}
        </div>
      )}

      <EmployeeProfileDrawer
        employee={selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        onUpdateStatus={handleUpdateStatus}
        canUpdateStatus={can("employees", "toggleStatus")}
      />
    </div>
  );
}
