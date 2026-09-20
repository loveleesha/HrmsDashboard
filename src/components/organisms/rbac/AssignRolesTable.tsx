"use client";

import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { Table } from "@/components/molecules/Table";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { Avatar } from "@/components/atoms/Avatar";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { CreateUserModal } from "@/components/organisms/rbac/CreateUserModal";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/use-rbac";
import { useRoles } from "@/hooks/use-roles";
import { getEmployees } from "@/services/employee.service";
import { assignAdminUserRole } from "@/services/admin-user.service";
import type { Employee } from "@/types/employee";

/** Role changes hit PATCH /api/admin/users/:userId/role (roleAccess.edit) with the role's id. */
export function AssignRolesTable() {
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [roleByUser, setRoleByUser] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const { roles, getRoleLabel } = useRoles();
  const { can } = useRBAC();
  const { showToast } = useToast();

  const canAssign = can("roleAccess", "edit");
  const canCreateUser = can("employeeOnboarding", "add");

  useEffect(() => {
    let isMounted = true;
    getEmployees()
      .then((data) => {
        if (isMounted) setEmployees(data);
      })
      .catch((err) => {
        if (isMounted) setLoadError(err instanceof Error ? err.message : "Could not load employees.");
      });
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleRoleChange(employee: Employee, roleName: string) {
    const role = roles.find((r) => r.name === roleName);
    if (!role || roleName === (roleByUser[employee.id] ?? employee.role)) return;
    setSavingId(employee.id);
    try {
      await assignAdminUserRole(employee.id, role.id);
      setRoleByUser((prev) => ({ ...prev, [employee.id]: roleName }));
      showToast(`${employee.name} is now assigned the ${role.label} role.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not assign this role.", "error");
    } finally {
      setSavingId(null);
    }
  }

  if (loadError) {
    return <p className="rounded-xl border border-dashed border-border bg-surface-card px-6 py-16 text-center text-fs-base text-danger">{loadError}</p>;
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
      {canCreateUser && (
        <div className="mb-4 flex justify-end">
          <Button onClick={() => setCreateOpen(true)}>
            <UserPlus className="size-4" />
            Create User
          </Button>
        </div>
      )}

      <Table
        columns={[
          {
            key: "employee",
            header: "Employee",
            render: (e: Employee) => (
              <div className="flex items-center gap-2.5">
                <Avatar name={e.name} imageUrl={e.avatarUrl} size="sm" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{e.name}</p>
                  <p className="truncate text-fs-sm text-muted">{e.email}</p>
                </div>
              </div>
            ),
          },
          { key: "designation", header: "Designation", render: (e: Employee) => e.designation || "—" },
          { key: "department", header: "Department", render: (e: Employee) => e.department || "—" },
          {
            key: "role",
            header: "Assigned Role",
            render: (e: Employee) => {
              const current = roleByUser[e.id] ?? e.role ?? "";
              if (!canAssign) return current ? getRoleLabel(current) : "—";
              return (
                <div className={savingId === e.id ? "pointer-events-none opacity-60" : undefined}>
                  <FilterDropdown
                    label="Select role"
                    ariaLabel={`Role for ${e.name}`}
                    options={roles.map((r) => ({ label: r.label, value: r.name }))}
                    value={current}
                    onChange={(value) => handleRoleChange(e, value)}
                    className="w-48"
                  />
                </div>
              );
            },
          },
        ]}
        data={employees}
        keyField={(e) => e.id}
        emptyMessage="No employees yet."
      />

      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} canAssignRole={canAssign} />
    </div>
  );
}
