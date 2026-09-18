"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Users, MapPin, Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { StatCard } from "@/components/molecules/StatCard";
import { Avatar } from "@/components/atoms/Avatar";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { ActionMenu } from "@/components/molecules/ActionMenu";
import { ConfirmModal } from "@/components/molecules/ConfirmModal";
import { DepartmentFormModal } from "@/components/organisms/organization/DepartmentFormModal";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/use-rbac";
import { useDepartments } from "@/hooks/use-departments";
import { getEmployees } from "@/services/employee.service";
import type { Employee } from "@/types/employee";
import type { ApiDepartment } from "@/types/department";

const DEPARTMENT_ICON_TONE = [
  "bg-info-bg text-info",
  "bg-success-bg text-success",
  "bg-warning-bg text-warning",
  "bg-primary-soft text-primary",
  "bg-danger-bg text-danger",
  "bg-surface text-muted",
];

export default function OrganizationPage() {
  const { showToast } = useToast();
  const { can } = useRBAC();
  const { departments, isLoading, createDepartment, updateDepartment, deleteDepartment } = useDepartments();
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ApiDepartment | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<ApiDepartment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getEmployees().then((data) => {
      if (isMounted) setEmployees(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const locations = useMemo(
    () => new Set((employees ?? []).map((e) => e.location).filter((location): location is string => Boolean(location))),
    [employees]
  );

  const departmentSummary = useMemo(() => {
    return departments.map((department) => {
      const members = (employees ?? []).filter((e) => e.department === department.name);
      const head = department.head
        ? members.find((m) => m.name === department.head)
        : (members.find((m) => m.designation.toLowerCase().includes("manager")) ?? members[0]);
      return { department, members, head };
    });
  }, [departments, employees]);

  async function handleCreate(payload: { name: string; description?: string }) {
    setIsSubmitting(true);
    try {
      await createDepartment(payload);
      showToast("Department added.");
      setFormOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not add this department.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate(id: string, payload: Parameters<typeof updateDepartment>[1]) {
    setIsSubmitting(true);
    try {
      await updateDepartment(id, payload);
      showToast("Department updated.");
      setFormOpen(false);
      setEditTarget(undefined);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update this department.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteDepartment(deleteTarget.id);
      showToast(`Deleted ${deleteTarget.name}.`);
      setDeleteTarget(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not delete this department.", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  const loading = !employees || isLoading;

  return (
    <div>
      <PageHeader
        title="Organization"
        description="Company structure, departments, and locations"
        actions={
          can("departments", "add") ? (
            <Button onClick={() => { setEditTarget(undefined); setFormOpen(true); }}>
              <Plus className="size-4" />
              Add Department
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-24 text-muted">
          <Spinner />
          Loading organization…
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard label="Total Employees" value={String(employees.length)} icon={Users} />
            <StatCard label="Departments" value={String(departments.length)} icon={Building2} />
            <StatCard label="Office Locations" value={String(locations.size)} icon={MapPin} />
          </div>

          <div className="mb-4 flex items-center gap-2">
            <Building2 className="size-4 text-primary" />
            <h2 className="text-fs-xl font-semibold text-ink">Departments</h2>
          </div>

          {departmentSummary.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-surface-card px-6 py-16 text-center text-fs-base text-muted">
              No departments yet. {can("departments", "add") && 'Use "Add Department" to create the first one.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {departmentSummary.map(({ department, members, head }, index) => (
                <div key={department.id} className="flex flex-col gap-3 rounded-xl border border-border bg-surface-card p-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex size-10 items-center justify-center rounded-lg ${DEPARTMENT_ICON_TONE[index % DEPARTMENT_ICON_TONE.length]}`}
                    >
                      <Building2 className="size-5" />
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-fs-sm text-muted">{members.length} members</span>
                      <ActionMenu
                        ariaLabel={`Actions for ${department.name}`}
                        items={[
                          {
                            label: "Edit",
                            icon: Pencil,
                            onClick: () => { setEditTarget(department); setFormOpen(true); },
                            hidden: !can("departments", "edit"),
                          },
                          {
                            label: "Delete",
                            icon: Trash2,
                            tone: "danger",
                            onClick: () => setDeleteTarget(department),
                            hidden: !can("departments", "delete"),
                          },
                        ]}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-fs-xl font-semibold text-ink">{department.name}</p>
                      {department.status === "inactive" && <StatusBadge status="Inactive" />}
                    </div>
                    {department.description && <p className="text-fs-sm text-muted">{department.description}</p>}
                    {head && <p className="text-fs-base text-muted">Led by {head.name}</p>}
                  </div>
                  {head && (
                    <div className="flex items-center gap-2 border-t border-border pt-3">
                      <Avatar name={head.name} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-fs-base font-medium text-ink">{head.name}</p>
                        <p className="truncate text-fs-sm text-muted">{head.designation}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex -space-x-2">
                    {members.slice(0, 6).map((member) => (
                      <Avatar key={member.id} name={member.name} imageUrl={member.avatarUrl} size="sm" className="border-2 border-surface-card" />
                    ))}
                    {members.length > 6 && (
                      <span className="flex size-8 items-center justify-center rounded-full border-2 border-surface-card bg-surface text-fs-sm text-muted">
                        +{members.length - 6}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <DepartmentFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(undefined); }}
        department={editTarget}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        isSubmitting={isSubmitting}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirmed}
        title="Delete Department"
        description={deleteTarget?.name}
        body="This can't be undone. Departments still assigned to an employee can't be deleted."
        confirmLabel="Delete Department"
        isConfirming={isDeleting}
      />
    </div>
  );
}
