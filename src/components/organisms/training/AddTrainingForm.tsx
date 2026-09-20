"use client";

import { useState } from "react";
import { Modal } from "@/components/molecules/Modal";
import { FormField } from "@/components/molecules/FormField";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { DatePickerField } from "@/components/molecules/DatePickerField";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { useRoles } from "@/hooks/use-roles";
import type { TrainingMode } from "@/types/training";
import { applyTextRules } from "@/lib/validation";

export interface AddTrainingFormValues {
  topic: string;
  targetRole: string;
  trainer: string;
  mode: TrainingMode;
  date: string;
}

export interface AddTrainingFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: AddTrainingFormValues) => void;
  isSubmitting?: boolean;
  /** Present → editing an existing program instead of creating one. */
  initialValues?: AddTrainingFormValues;
}

export function AddTrainingForm({ open, onClose, onSubmit, isSubmitting, initialValues }: AddTrainingFormProps) {
  const isEdit = Boolean(initialValues);
  const { roles } = useRoles();
  const [topic, setTopic] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [trainer, setTrainer] = useState("");
  const [mode, setMode] = useState<TrainingMode | "">("");
  const [date, setDate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [wasOpen, setWasOpen] = useState(open);

  // Re-seed on every open — adjusted during render, not an effect, so it
  // happens before paint instead of causing an extra render.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setTopic(initialValues?.topic ?? "");
      setTargetRole(initialValues?.targetRole ?? "");
      setTrainer(initialValues?.trainer ?? "");
      setMode(initialValues?.mode ?? "");
      setDate(initialValues?.date ?? "");
      setErrors({});
    }
  }

  function handleSubmit() {
    const nextErrors: Record<string, string> = {};
    if (!topic.trim()) nextErrors.topic = "Topic is required.";
    if (!targetRole) nextErrors.targetRole = "Select the target role.";
    if (!trainer.trim()) nextErrors.trainer = "Trainer name is required.";
    if (!mode) nextErrors.mode = "Select a delivery mode.";
    if (!date) nextErrors.date = "Select a date.";

    applyTextRules(nextErrors, {
      topic: [topic, "Topic", { min: 3, max: 100 }],
      trainer: [trainer, "Trainer name", { min: 2, max: 60 }],
    });

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit({ topic: topic.trim(), targetRole, trainer: trainer.trim(), mode: mode as TrainingMode, date });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Training Program" : "Add Training Program"}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            {isEdit ? "Save Changes" : "Add Program"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="Topic" htmlFor="training-topic" error={errors.topic} required>
          <Input id="training-topic" value={topic} onChange={(e) => setTopic(e.target.value)} invalid={Boolean(errors.topic)} />
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Role" htmlFor="training-role" error={errors.targetRole} required>
            <FilterDropdown
              label="Select Role"
              options={roles.map((r) => ({ label: r.label, value: r.name }))}
              value={targetRole}
              onChange={setTargetRole}
            />
          </FormField>
          <FormField label="Mode" htmlFor="training-mode" error={errors.mode} required>
            <FilterDropdown
              label="Select Mode"
              options={[
                { label: "Online", value: "Online" },
                { label: "Offline", value: "Offline" },
                { label: "Hybrid", value: "Hybrid" },
              ]}
              value={mode}
              onChange={(v) => setMode(v as TrainingMode)}
            />
          </FormField>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Trainer" htmlFor="training-trainer" error={errors.trainer} required>
            <Input id="training-trainer" value={trainer} onChange={(e) => setTrainer(e.target.value)} invalid={Boolean(errors.trainer)} />
          </FormField>
          <DatePickerField label="Date" value={date} onChange={(e) => setDate(e.target.value)} error={errors.date} />
        </div>
      </div>
    </Modal>
  );
}
