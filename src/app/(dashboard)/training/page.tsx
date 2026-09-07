"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Table } from "@/components/molecules/Table";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { AddTrainingForm, type AddTrainingFormValues } from "@/components/organisms/training/AddTrainingForm";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/use-rbac";
import { getTrainingPrograms, newTrainingId } from "@/services/training.service";
import { ROLE_LABELS } from "@/types/user";
import type { TrainingProgram } from "@/types/training";

export default function TrainingPage() {
  const { showToast } = useToast();
  const { can, viewAsRole } = useRBAC();

  const [programs, setPrograms] = useState<TrainingProgram[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const canAdd = can("training", "add");
  const canManageAll = can("training", "edit");

  useEffect(() => {
    let isMounted = true;
    getTrainingPrograms().then((data) => {
      if (isMounted) setPrograms(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const visiblePrograms = useMemo(() => {
    if (!programs) return [];
    return canManageAll ? programs : programs.filter((p) => p.targetRole === viewAsRole);
  }, [programs, canManageAll, viewAsRole]);

  function handleAdd(values: AddTrainingFormValues) {
    const newProgram: TrainingProgram = {
      id: newTrainingId(),
      topic: values.topic,
      targetRole: values.targetRole,
      trainer: values.trainer,
      mode: values.mode,
      date: values.date,
      status: "Upcoming",
      enrolled: 0,
    };
    setPrograms((prev) => [newProgram, ...(prev ?? [])]);
    setFormOpen(false);
    showToast(`${newProgram.topic} added to the training calendar.`);
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
            { key: "role", header: "Role", render: (p: TrainingProgram) => <Badge tone="neutral">{ROLE_LABELS[p.targetRole]}</Badge> },
            { key: "trainer", header: "Trainer", render: (p: TrainingProgram) => p.trainer },
            { key: "mode", header: "Mode", render: (p: TrainingProgram) => p.mode },
            {
              key: "date",
              header: "Date",
              render: (p: TrainingProgram) => new Date(p.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
            },
            { key: "enrolled", header: "Enrolled", render: (p: TrainingProgram) => p.enrolled },
            { key: "status", header: "Status", render: (p: TrainingProgram) => <StatusBadge status={p.status} /> },
          ]}
          data={visiblePrograms}
          keyField={(p) => p.id}
          emptyMessage="No training programs scheduled for this role yet."
        />
      )}

      <AddTrainingForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleAdd} />
    </div>
  );
}
