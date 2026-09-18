"use client";

import { useState } from "react";
import { Modal } from "@/components/molecules/Modal";
import { FormField } from "@/components/molecules/FormField";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { Input } from "@/components/atoms/Input";
import { Textarea } from "@/components/atoms/Textarea";
import { Button } from "@/components/atoms/Button";
import type { ApiDepartment, CreateDepartmentPayload, UpdateDepartmentPayload } from "@/types/department";

export interface DepartmentFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Present in edit mode — undefined means "create". Editing also exposes
   * head/status, which the create endpoint doesn't accept. */
  department?: ApiDepartment;
  onCreate: (payload: CreateDepartmentPayload) => Promise<void>;
  onUpdate: (id: string, payload: UpdateDepartmentPayload) => Promise<void>;
  isSubmitting?: boolean;
}

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

export function DepartmentFormModal({
  open,
  onClose,
  department,
  onCreate,
  onUpdate,
  isSubmitting,
}: DepartmentFormModalProps) {
  const isEdit = Boolean(department);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [head, setHead] = useState("");
  const [status, setStatus] = useState("active");
  const [error, setError] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);

  // Re-seed the fields from `department` on every open (not just once at
  // mount) — adjusted during render, not an effect, so it happens before
  // paint instead of causing an extra render.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName(department?.name ?? "");
      setDescription(department?.description ?? "");
      setHead(department?.head ?? "");
      setStatus(department?.status ?? "active");
      setError(null);
    }
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Department name is required.");
      return;
    }
    setError(null);
    if (isEdit && department) {
      await onUpdate(department.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        head: head.trim() || undefined,
        status: status as "active" | "inactive",
      });
    } else {
      await onCreate({ name: name.trim(), description: description.trim() || undefined });
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Department" : "Add Department"}
      description={isEdit ? undefined : "Department names must be unique across the organization."}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            {isEdit ? "Save Changes" : "Add Department"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="Department Name" htmlFor="deptName" required error={error ?? undefined}>
          <Input id="deptName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Engineering" />
        </FormField>
        <FormField label="Description" htmlFor="deptDescription">
          <Textarea
            id="deptDescription"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What this department is responsible for"
          />
        </FormField>
        {isEdit && (
          <>
            <FormField label="Department Head" htmlFor="deptHead">
              <Input id="deptHead" value={head} onChange={(e) => setHead(e.target.value)} placeholder="e.g. Priya Nair" />
            </FormField>
            <FormField label="Status" htmlFor="deptStatus">
              <FilterDropdown label="Status" options={STATUS_OPTIONS} value={status} onChange={setStatus} />
            </FormField>
          </>
        )}
      </div>
    </Modal>
  );
}
