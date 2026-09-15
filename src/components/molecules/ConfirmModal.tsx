"use client";

import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/molecules/Modal";
import { Button } from "@/components/atoms/Button";

export interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  /** Short line under the title, e.g. the specific item being acted on. */
  description?: string;
  /** Longer explanation shown in the body — what happens, and why it might fail. */
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  tone?: "danger" | "default";
}

/**
 * Shared confirmation dialog for destructive/irreversible actions (delete a
 * role, discard an onboarding record, ...) — replaces ad hoc
 * `window.confirm()` calls with something that matches the rest of the UI
 * and can show real context (what happens, why it might be blocked).
 */
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isConfirming,
  tone = "danger",
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      widthClassName="sm:max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isConfirming}>
            {cancelLabel}
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} isLoading={isConfirming}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      {body && (
        <div className="flex items-start gap-3">
          {tone === "danger" && (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-danger-bg text-danger">
              <AlertTriangle className="size-4" />
            </span>
          )}
          <p className="text-fs-base text-muted">{body}</p>
        </div>
      )}
    </Modal>
  );
}
