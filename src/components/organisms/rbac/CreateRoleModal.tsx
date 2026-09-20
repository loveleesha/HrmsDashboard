"use client";

import { useState } from "react";
import { Modal } from "@/components/molecules/Modal";
import { FormField } from "@/components/molecules/FormField";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { textError } from "@/lib/validation";

export interface CreateRoleModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: { name: string; label: string }) => Promise<void> | void;
  isSubmitting?: boolean;
}

function slugify(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function CreateRoleModal({ open, onClose, onCreate, isSubmitting }: CreateRoleModalProps) {
  const [label, setLabel] = useState("");
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleLabelChange(value: string) {
    setLabel(value);
    if (!nameTouched) setName(slugify(value));
  }

  function handleClose() {
    setLabel("");
    setName("");
    setNameTouched(false);
    setError(null);
    onClose();
  }

  async function handleSubmit() {
    if (!label.trim()) {
      setError("Role name is required.");
      return;
    }
    if (!name.trim()) {
      setError("Role key is required.");
      return;
    }
    const labelIssue = textError(label, "Role name", { min: 2, max: 40 });
    if (labelIssue) {
      setError(labelIssue);
      return;
    }
    if (name.trim().length > 40) {
      setError("Role key must be 40 characters or fewer.");
      return;
    }
    setError(null);
    await onCreate({ name: name.trim(), label: label.trim() });
    setLabel("");
    setName("");
    setNameTouched(false);
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create Role"
      description="New roles start with no permissions — grant access from the matrix after creating."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            Create Role
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="Display Name" htmlFor="roleLabel" required error={error && !error.startsWith("Role key") ? error : undefined}>
          <Input
            id="roleLabel"
            value={label}
            onChange={(e) => handleLabelChange(e.target.value)}
            placeholder="e.g. Team Lead"
          />
        </FormField>
        <FormField
          label="Role Key"
          htmlFor="roleName"
          required
          hint="Unique identifier used by the backend — lowercase, no spaces."
          error={error?.startsWith("Role key") ? error : undefined}
        >
          <Input
            id="roleName"
            value={name}
            onChange={(e) => {
              setNameTouched(true);
              setName(slugify(e.target.value));
            }}
            placeholder="e.g. team_lead"
          />
        </FormField>
      </div>
    </Modal>
  );
}
