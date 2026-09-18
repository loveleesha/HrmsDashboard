"use client";

import { useState } from "react";
import { Modal } from "@/components/molecules/Modal";
import { FormField } from "@/components/molecules/FormField";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { Input } from "@/components/atoms/Input";
import { Textarea } from "@/components/atoms/Textarea";
import { Button } from "@/components/atoms/Button";
import { TICKET_PRIORITIES, TICKET_CATEGORIES, type CreateTicketPayload, type TicketPriority } from "@/types/ticket";

export interface TicketFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateTicketPayload) => Promise<boolean>;
  isSubmitting?: boolean;
}

export function TicketForm({ open, onClose, onSubmit, isSubmitting }: TicketFormProps) {
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<TicketPriority | "">("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function reset() {
    setCategory("");
    setSubject("");
    setMessage("");
    setPriority("");
    setErrors({});
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    const nextErrors: Record<string, string> = {};
    if (!category) nextErrors.category = "Select a category.";
    if (!subject.trim()) nextErrors.subject = "Add a short subject.";
    if (!message.trim()) nextErrors.message = "Describe the issue.";
    if (!priority) nextErrors.priority = "Select a priority.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const created = await onSubmit({
      category,
      subject: subject.trim(),
      message: message.trim(),
      priority: priority as TicketPriority,
    });
    if (created) reset();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create New Ticket"
      description="Fill in the details below to raise a support request."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            Submit Ticket
          </Button>
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
              onChange={setCategory}
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

        <FormField label="Description" htmlFor="ticket-message" error={errors.message} required>
          <Textarea
            id="ticket-message"
            rows={4}
            placeholder="Describe the issue in detail…"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            invalid={Boolean(errors.message)}
          />
        </FormField>
      </div>
    </Modal>
  );
}
