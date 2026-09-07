"use client";

import { useState } from "react";
import { Modal } from "@/components/molecules/Modal";
import { FormField } from "@/components/molecules/FormField";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { Input } from "@/components/atoms/Input";
import { Textarea } from "@/components/atoms/Textarea";
import { Button } from "@/components/atoms/Button";
import { TICKET_PRIORITIES, TICKET_CATEGORIES, type TicketCategory, type TicketPriority } from "@/types/ticket";

export interface TicketFormValues {
  category: TicketCategory;
  subject: string;
  description: string;
  priority: TicketPriority;
}

export interface TicketFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: TicketFormValues) => void;
}

export function TicketForm({ open, onClose, onSubmit }: TicketFormProps) {
  const [category, setCategory] = useState<TicketCategory | "">("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority | "">("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function reset() {
    setCategory("");
    setSubject("");
    setDescription("");
    setPriority("");
    setErrors({});
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit() {
    const nextErrors: Record<string, string> = {};
    if (!category) nextErrors.category = "Select a category.";
    if (!subject.trim()) nextErrors.subject = "Add a short subject.";
    if (!description.trim()) nextErrors.description = "Describe the issue.";
    if (!priority) nextErrors.priority = "Select a priority.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit({
      category: category as TicketCategory,
      subject: subject.trim(),
      description: description.trim(),
      priority: priority as TicketPriority,
    });
    reset();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create New Ticket"
      description="Fill in the details below to raise a support request."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Submit Ticket</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Category" htmlFor="ticket-category" error={errors.category} required>
            <FilterDropdown
              label="Select Category"
              options={TICKET_CATEGORIES.map((c) => ({ label: c, value: c }))}
              value={category}
              onChange={(value) => setCategory(value as TicketCategory)}
            />
          </FormField>
          <FormField label="Priority" htmlFor="ticket-priority" error={errors.priority} required>
            <FilterDropdown
              label="Select Priority"
              options={TICKET_PRIORITIES.map((p) => ({ label: p, value: p }))}
              value={priority}
              onChange={(value) => setPriority(value as TicketPriority)}
            />
          </FormField>
        </div>

        <FormField label="Subject" htmlFor="ticket-subject" error={errors.subject} required>
          <Input
            id="ticket-subject"
            placeholder="Short summary of your request"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            invalid={Boolean(errors.subject)}
          />
        </FormField>

        <FormField label="Description" htmlFor="ticket-description" error={errors.description} required>
          <Textarea
            id="ticket-description"
            rows={4}
            placeholder="Describe the issue in detail…"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            invalid={Boolean(errors.description)}
          />
        </FormField>
      </div>
    </Modal>
  );
}
