"use client";

import { useEffect, useState } from "react";
import { Table } from "@/components/molecules/Table";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { Avatar } from "@/components/atoms/Avatar";
import { Spinner } from "@/components/atoms/Spinner";
import { useToast } from "@/hooks/use-toast";
import { useRoleAssignments } from "@/hooks/use-role-assignments";
import { useRoles } from "@/hooks/use-roles";
import { getEmployees } from "@/services/employee.service";
import type { Employee } from "@/types/employee";

export function AssignRolesTable() {
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const { getRole, setRole } = useRoleAssignments();
  const { roles, getRoleLabel } = useRoles();
  const { showToast } = useToast();

  useEffect(() => {
    let isMounted = true;
    getEmployees().then((data) => {
      if (isMounted) setEmployees(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  if (!employees) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted">
        <Spinner />
        Loading employees…
      </div>
    );
  }

  return (
    <Table
      columns={[
        {
          key: "employee",
          header: "Employee",
          render: (e: Employee) => (
            <div className="flex items-center gap-2.5">
              <Avatar name={e.name} size="sm" />
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{e.name}</p>
                <p className="truncate text-fs-sm text-muted">{e.id}</p>
              </div>
            </div>
          ),
        },
        { key: "designation", header: "Designation", render: (e: Employee) => e.designation },
        { key: "department", header: "Department", render: (e: Employee) => e.department },
        {
          key: "role",
          header: "Assigned Role",
          render: (e: Employee) => (
            <FilterDropdown
              label="Role"
              options={roles.map((r) => ({ label: r.label, value: r.name }))}
              value={getRole(e.id)}
              onChange={(value) => {
                setRole(e.id, value);
                showToast(`${e.name} is now assigned the ${getRoleLabel(value)} role.`);
              }}
              className="w-48"
            />
          ),
        },
      ]}
      data={employees}
      keyField={(e) => e.id}
    />
  );
}
