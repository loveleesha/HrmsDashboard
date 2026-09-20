"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, CalendarCheck2, XCircle, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Table } from "@/components/molecules/Table";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { ActionMenu } from "@/components/molecules/ActionMenu";
import { ConfirmModal } from "@/components/molecules/ConfirmModal";
import { ReasonModal } from "@/components/molecules/ReasonModal";
import { AddTrainingForm, type AddTrainingFormValues } from "@/components/organisms/training/AddTrainingForm";
import { AttendanceRosterDrawer } from "@/components/organisms/training/AttendanceRosterDrawer";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/use-rbac";
import { useRoles } from "@/hooks/use-roles";
import {
  createTraining,
  deleteTraining,
  getAttendanceRoster,
  listAllTrainings,
  listMyTrainings,
  markAttendance,
  updateTraining,
  updateTrainingStatus,
} from "@/services/training.service";
import type { AttendanceStatus, TrainingAttendanceEntry, TrainingProgram } from "@/types/training";

export default function TrainingPage() {
  const { showToast } = useToast();
  const { can } = useRBAC();
  const { getRoleLabel } = useRoles();

  const canAdd = can("training", "add");
  const canManageAll = can("training", "edit");
  const canDelete = can("training", "delete");

  const [programs, setPrograms] = useState<TrainingProgram[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TrainingProgram | null>(null);
  const [cancelTarget, setCancelTarget] = useState<TrainingProgram | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TrainingProgram | null>(null);
  const [attendanceTarget, setAttendanceTarget] = useState<TrainingProgram | null>(null);
  const [roster, setRoster] = useState<TrainingAttendanceEntry[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(() => {
    (canManageAll ? listAllTrainings() : listMyTrainings()).then(setPrograms);
  }, [canManageAll]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(values: AddTrainingFormValues) {
    setIsSubmitting(true);
    try {
      await createTraining({ topic: values.topic, role: values.targetRole, mode: values.mode, trainer: values.trainer, date: values.date });
      showToast(`${values.topic} added to the training calendar.`);
      setFormOpen(false);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not add this training program.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEdit(values: AddTrainingFormValues) {
    if (!editTarget) return;
    setIsSubmitting(true);
    try {
      await updateTraining(editTarget.id, { topic: values.topic, role: values.targetRole, mode: values.mode, trainer: values.trainer, date: values.date });
      showToast("Training program updated.");
      setEditTarget(null);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update this training program.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusChange(program: TrainingProgram, status: "Active" | "Completed") {
    try {
      await updateTrainingStatus(program.id, status);
      showToast(`${program.topic} marked ${status.toLowerCase()}.`);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update this program's status.", "error");
    }
  }

  async function handleCancel(reason: string) {
    if (!cancelTarget) return;
    setIsSubmitting(true);
    try {
      await updateTrainingStatus(cancelTarget.id, "Cancelled", reason);
      showToast("Training program cancelled.", "info");
      setCancelTarget(null);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not cancel this training program.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await deleteTraining(deleteTarget.id);
      showToast("Training program deleted.");
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not delete this training program.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  function openAttendance(program: TrainingProgram) {
    setAttendanceTarget(program);
    setRoster(null);
    getAttendanceRoster(program.id)
      .then(setRoster)
      .catch((err) => {
        showToast(err instanceof Error ? err.message : "Could not load the attendance roster.", "error");
        setAttendanceTarget(null);
      });
  }

  async function handleSaveAttendance(entries: { employeeId: string; status: AttendanceStatus }[]) {
    if (!attendanceTarget) return;
    setIsSubmitting(true);
    try {
      await markAttendance(attendanceTarget.id, entries);
      showToast("Attendance saved.");
      setAttendanceTarget(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not save attendance.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Training"
        description="Programs, enrollment, and certifications."
        actions={
          canAdd ? (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="size-4" />
              Add Program
            </Button>
          ) : undefined
        }
      />

      {!programs ? (
        <div className="flex items-center justify-center gap-2 py-24 text-muted">
          <Spinner />
          Loading training programs…
        </div>
      ) : (
        <Table
          columns={[
            { key: "topic", header: "Topic", render: (p: TrainingProgram) => <span className="font-medium text-ink">{p.topic}</span> },
            { key: "role", header: "Role", render: (p: TrainingProgram) => <Badge tone="neutral">{getRoleLabel(p.targetRole)}</Badge> },
            { key: "trainer", header: "Trainer", render: (p: TrainingProgram) => p.trainer },
            { key: "mode", header: "Mode", render: (p: TrainingProgram) => p.mode },
            {
              key: "date",
              header: "Date",
              render: (p: TrainingProgram) => (p.date ? new Date(p.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"),
            },
            ...(canManageAll ? [{ key: "enrolled", header: "Enrolled", render: (p: TrainingProgram) => p.enrolled ?? "—" }] : []),
            { key: "status", header: "Status", render: (p: TrainingProgram) => <StatusBadge status={p.status} /> },
            ...(canManageAll
              ? [
                  {
                    key: "actions",
                    header: "",
                    render: (p: TrainingProgram) => (
                      <ActionMenu
                        items={[
                          { label: "Edit", icon: Pencil, onClick: () => setEditTarget(p) },
                          { label: "Attendance", icon: CalendarCheck2, onClick: () => openAttendance(p) },
                          { label: "Mark Completed", icon: CalendarCheck2, onClick: () => handleStatusChange(p, "Completed"), hidden: p.status !== "Active" },
                          { label: "Reactivate", icon: RotateCcw, onClick: () => handleStatusChange(p, "Active"), hidden: p.status === "Active" },
                          { label: "Cancel", icon: XCircle, onClick: () => setCancelTarget(p), hidden: p.status === "Cancelled", tone: "danger" as const },
                          { label: "Delete", icon: Trash2, onClick: () => setDeleteTarget(p), hidden: !canDelete, tone: "danger" as const },
                        ]}
                      />
                    ),
                  },
                ]
              : []),
          ]}
          data={programs}
          keyField={(p) => p.id}
          emptyMessage="No training programs scheduled for this role yet."
        />
      )}

      <AddTrainingForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleAdd} isSubmitting={isSubmitting} />
      <AddTrainingForm
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEdit}
        isSubmitting={isSubmitting}
        initialValues={
          editTarget
            ? { topic: editTarget.topic, targetRole: editTarget.targetRole, trainer: editTarget.trainer, mode: editTarget.mode, date: editTarget.date }
            : undefined
        }
      />
      <ReasonModal
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onSubmit={handleCancel}
        title="Cancel training program"
        description={cancelTarget?.topic}
        label="Cancellation reason"
        confirmLabel="Cancel Program"
        isSubmitting={isSubmitting}
      />
      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete this training program?"
        description={deleteTarget?.topic}
        body="This can't be undone."
        confirmLabel="Delete"
        isConfirming={isSubmitting}
      />
      <AttendanceRosterDrawer
        open={Boolean(attendanceTarget)}
        onClose={() => setAttendanceTarget(null)}
        training={attendanceTarget}
        roster={roster}
        onSave={handleSaveAttendance}
        isSaving={isSubmitting}
      />
    </div>
  );
}
