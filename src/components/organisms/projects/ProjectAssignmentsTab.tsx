"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Table } from "@/components/molecules/Table";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { SearchInput } from "@/components/molecules/SearchInput";
import { ActionMenu } from "@/components/molecules/ActionMenu";
import { ConfirmModal } from "@/components/molecules/ConfirmModal";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { AssignProjectModal } from "@/components/organisms/projects/AssignProjectModal";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/use-rbac";
import { assignProject, listAssignments, unassignProject, updateAssignmentStatus } from "@/services/project.service";
import { ASSIGNMENT_STATUSES, ASSIGNMENT_STATUS_LABELS, type AssignmentStatus, type ProjectAssignment } from "@/types/project";

const STATUS_OPTIONS = ASSIGNMENT_STATUSES.map((s) => ({ label: ASSIGNMENT_STATUS_LABELS[s], value: s }));

/** Admin > Project Assignments — list (projects.edit), assign (add), update status (edit), unassign (delete). */
export function ProjectAssignmentsTab() {
  const { showToast } = useToast();
  const { can } = useRBAC();
  const [assignments, setAssignments] = useState<ProjectAssignment[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<ProjectAssignment | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    listAssignments()
      .then((data) => {
        if (isMounted) setAssignments(data);
      })
      .catch((err) => {
        if (isMounted) setLoadError(err instanceof Error ? err.message : "Could not load assignments.");
      });
    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (assignments ?? []).filter(
      (a) =>
        (!status || a.status === status) &&
        (!query || a.projectName.toLowerCase().includes(query) || a.employeeName?.toLowerCase().includes(query) || a.employeeCode?.toLowerCase().includes(query))
    );
  }, [assignments, search, status]);

  async function handleAssign(params: { userId: string; projectId: string }): Promise<boolean> {
    try {
      await assignProject(params);
      showToast("Project assigned.");
      setAssignOpen(false);
      setAssignments(null);
      setReloadKey((k) => k + 1);
      return true;
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not assign this project.", "error");
      return false;
    }
  }

  async function handleStatusChange(assignment: ProjectAssignment, next: string) {
    if (!next || next === assignment.status) return;
    setSavingId(assignment.id);
    try {
      await updateAssignmentStatus(assignment.id, next as AssignmentStatus);
      setAssignments((prev) => (prev ?? []).map((a) => (a.id === assignment.id ? { ...a, status: next as AssignmentStatus } : a)));
      showToast("Assignment updated.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update this assignment.", "error");
    } finally {
      setSavingId(null);
    }
  }

  async function handleRemoveConfirmed() {
    if (!removeTarget) return;
    setIsRemoving(true);
    try {
      await unassignProject(removeTarget.id);
      setAssignments((prev) => (prev ?? []).filter((a) => a.id !== removeTarget.id));
      showToast("Project unassigned.");
      setRemoveTarget(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not unassign this project.", "error");
    } finally {
      setIsRemoving(false);
    }
  }

  const canEdit = can("projects", "edit");
  const canUnassign = can("projects", "delete");

  if (loadError) {
    return <p className="rounded-xl border border-dashed border-border bg-surface-card px-6 py-16 text-center text-fs-base text-danger">{loadError}</p>;
  }
  if (!assignments) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted">
        <Spinner />
        Loading assignments…
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-surface-card p-4 sm:flex-row">
        <SearchInput placeholder="Search by employee or project…" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:flex-1" />
        <FilterDropdown label="All statuses" options={STATUS_OPTIONS} value={status} onChange={setStatus} className="sm:w-44" />
        {can("projects", "add") && (
          <Button onClick={() => setAssignOpen(true)}>
            <Plus className="size-4" />
            Assign Project
          </Button>
        )}
      </div>

      <Table
        columns={[
          {
            key: "employee",
            header: "Employee",
            render: (a: ProjectAssignment) => (
              <div>
                <p className="font-medium text-ink">{a.employeeName ?? "—"}</p>
                {a.employeeCode && <p className="text-fs-sm text-muted">{a.employeeCode}</p>}
              </div>
            ),
          },
          { key: "project", header: "Project", render: (a: ProjectAssignment) => a.projectName },
          {
            key: "status",
            header: "Assignment Status",
            render: (a: ProjectAssignment) =>
              canEdit ? (
                <div className={savingId === a.id ? "pointer-events-none opacity-60" : undefined}>
                  <FilterDropdown label="Status" ariaLabel={`Status for ${a.employeeName ?? "employee"} on ${a.projectName}`} options={STATUS_OPTIONS} value={a.status} onChange={(v) => handleStatusChange(a, v)} className="w-40" />
                </div>
              ) : (
                <StatusBadge status={ASSIGNMENT_STATUS_LABELS[a.status]} />
              ),
          },
          { key: "projectStatus", header: "Project", render: (a: ProjectAssignment) => <StatusBadge status={a.projectStatus === "active" ? "Active" : "Inactive"} /> },
          ...(canUnassign
            ? [
                {
                  key: "actions",
                  header: "",
                  headerClassName: "w-10",
                  className: "text-right",
                  render: (a: ProjectAssignment) => (
                    <div className="flex justify-end">
                      <ActionMenu ariaLabel={`Actions for ${a.projectName}`} items={[{ label: "Unassign", icon: Trash2, tone: "danger", onClick: () => setRemoveTarget(a) }]} />
                    </div>
                  ),
                },
              ]
            : []),
        ]}
        data={visible}
        keyField={(a) => a.id}
        emptyMessage={assignments.length === 0 ? "No project assignments yet." : "No assignments match your filters."}
      />

      {assignOpen && <AssignProjectModal onClose={() => setAssignOpen(false)} onAssign={handleAssign} />}

      <ConfirmModal
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemoveConfirmed}
        title="Unassign Project"
        description={removeTarget ? `${removeTarget.employeeName ?? "Employee"} · ${removeTarget.projectName}` : undefined}
        body="The employee will no longer see this project under My Projects."
        confirmLabel="Unassign"
        isConfirming={isRemoving}
      />
    </div>
  );
}
