"use client";

import { useState } from "react";
import { Modal } from "@/components/molecules/Modal";
import { FormField } from "@/components/molecules/FormField";
import { Textarea } from "@/components/atoms/Textarea";
import { Button } from "@/components/atoms/Button";

export interface RejectDocumentModalProps {
  open: boolean;
  documentName?: string;
  onClose: () => void;
  onReject: (reason: string) => void;
  isSubmitting?: boolean;
}

export function RejectDocumentModal({ open, documentName, onClose, onReject, isSubmitting }: RejectDocumentModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setReason("");
    setError(null);
    onClose();
  }

  function handleSubmit() {
    if (!reason.trim()) {
      setError("Rejection reason is required.");
      return;
    }
    onReject(reason.trim());
    setReason("");
    setError(null);
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Reject Document"
      description={documentName}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleSubmit} isLoading={isSubmitting}>
            Reject Document
          </Button>
        </div>
      }
    >
      <FormField label="Rejection Reason" htmlFor="rejectionReason" required error={error ?? undefined}>
        <Textarea
          id="rejectionReason"
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          invalid={Boolean(error)}
          placeholder="e.g. Document is blurred and illegible, please re-upload a clear scan."
        />
      </FormField>
    </Modal>
  );
}
