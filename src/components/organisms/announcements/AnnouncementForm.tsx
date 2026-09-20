"use client";

import { useState } from "react";
import { Modal } from "@/components/molecules/Modal";
import { FormField } from "@/components/molecules/FormField";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { Input } from "@/components/atoms/Input";
import { Textarea } from "@/components/atoms/Textarea";
import { Button } from "@/components/atoms/Button";
import type { AnnouncementPriority } from "@/types/announcement";
import { applyTextRules } from "@/lib/validation";

export interface AnnouncementFormValues {
  title: string;
  body: string;
  priority: AnnouncementPriority;
}

export interface AnnouncementFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: AnnouncementFormValues) => void;
}

export function AnnouncementForm({ open, onClose, onSubmit }: AnnouncementFormProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<AnnouncementPriority | "">("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function reset() {
    setTitle("");
    setBody("");
    setPriority("");
    setErrors({});
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit() {
    const nextErrors: Record<string, string> = {};
    if (!title.trim()) nextErrors.title = "Add a title.";
    if (!body.trim()) nextErrors.body = "Add the announcement body.";
    if (!priority) nextErrors.priority = "Select a priority.";

    applyTextRules(nextErrors, {
      title: [title, "Title", { max: 120 }],
      body: [body, "Announcement", { max: 2000 }],
    });

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit({ title: title.trim(), body: body.trim(), priority: priority as AnnouncementPriority });
    reset();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New Announcement"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Publish</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="Title" htmlFor="announcement-title" error={errors.title} required>
          <Input id="announcement-title" value={title} onChange={(e) => setTitle(e.target.value)} invalid={Boolean(errors.title)} />
        </FormField>
        <FormField label="Priority" htmlFor="announcement-priority" error={errors.priority} required>
          <FilterDropdown
            label="Select Priority"
            options={[
              { label: "Normal", value: "Normal" },
              { label: "High", value: "High" },
            ]}
            value={priority}
            onChange={(v) => setPriority(v as AnnouncementPriority)}
          />
        </FormField>
        <FormField label="Message" htmlFor="announcement-body" error={errors.body} required>
          <Textarea id="announcement-body" rows={4} value={body} onChange={(e) => setBody(e.target.value)} invalid={Boolean(errors.body)} />
        </FormField>
      </div>
    </Modal>
  );
}
