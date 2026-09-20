"use client";

import { useState } from "react";
import { Modal } from "@/components/molecules/Modal";
import { FormField } from "@/components/molecules/FormField";
import { Textarea } from "@/components/atoms/Textarea";
import { Button } from "@/components/atoms/Button";

export interface ReasonModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  title: string;
  description?: string;
  label?: string;
  confirmLabel?: string;
  isSubmitting?: boolean;
}

/**
 * Shared "give a reason then confirm" dialog — every reject flow in the
 * collection (Leave, Expenses, Asset Requests) requires a non-empty
 * rejectionReason, so this replaces three near-identical one-off modals.
 */
export function ReasonModal({
  open,
  onClose,
  onSubmit,
  title,
  description,
  label = "Reason",
  confirmLabel = "Reject",
  isSubmitting,
}: ReasonModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);

  // Re-seed on every open — adjusted during render, not an effect, so it
  // happens before paint instead of causing an extra render.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setReason("");
      setError(null);
    }
  }

  function handleSubmit() {
    if (!reason.trim()) {
      setError("A reason is required.");
      return;
    }
    onSubmit(reason.trim());
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      widthClassName="sm:max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleSubmit} isLoading={isSubmitting}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <FormField label={label} htmlFor="reason-modal-input" error={error ?? undefined} required>
        <Textarea
          id="reason-modal-input"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          invalid={Boolean(error)}
        />
      </FormField>
    </Modal>
  );
}
