"use client";

import { useState } from "react";
import { Modal } from "@/components/molecules/Modal";
import { FormField } from "@/components/molecules/FormField";
import { DatePickerField } from "@/components/molecules/DatePickerField";
import { Input } from "@/components/atoms/Input";
import { Textarea } from "@/components/atoms/Textarea";
import { Button } from "@/components/atoms/Button";
import { applyTextRules, isPastDate } from "@/lib/validation";

export interface AddGoalValues {
  title: string;
  description: string;
  dueDate: string;
}

export function AddGoalForm({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: AddGoalValues) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function reset() {
    setTitle("");
    setDescription("");
    setDueDate("");
    setErrors({});
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit() {
    const nextErrors: Record<string, string> = {};
    if (!title.trim()) nextErrors.title = "Give your goal a title.";
    if (!description.trim()) nextErrors.description = "Describe what success looks like.";
    if (!dueDate) nextErrors.dueDate = "Set a target date.";

    applyTextRules(nextErrors, {
      title: [title, "Title", { min: 3, max: 100 }],
      description: [description, "Description", { max: 500 }],
    });
    if (dueDate && isPastDate(dueDate)) nextErrors.dueDate = "The target date can't be in the past.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    onSubmit({ title: title.trim(), description: description.trim(), dueDate });
    reset();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Goal"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add Goal</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="Title" htmlFor="goal-title" error={errors.title} required>
          <Input id="goal-title" value={title} onChange={(e) => setTitle(e.target.value)} invalid={Boolean(errors.title)} />
        </FormField>
        <FormField label="Description" htmlFor="goal-description" error={errors.description} required>
          <Textarea id="goal-description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} invalid={Boolean(errors.description)} />
        </FormField>
        <DatePickerField label="Due Date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} error={errors.dueDate} />
      </div>
    </Modal>
  );
}
