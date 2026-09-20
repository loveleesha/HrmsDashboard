"use client";

import { useState } from "react";
import { Modal } from "@/components/molecules/Modal";
import { FormField } from "@/components/molecules/FormField";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { Button } from "@/components/atoms/Button";
import type { HierarchyEmployeeRef, HierarchyProject } from "@/types/hierarchy";

export interface AssignManagerModalProps {
  open: boolean;
  onClose: () => void;
  project: HierarchyProject | null;
  /** Every manager not already assigned to this project. */
  candidates: HierarchyEmployeeRef[];
  onSubmit: (managerUserId: string) => void;
  isSubmitting?: boolean;
}

/** Wraps Admin > Project Assignments > Assign Project to Employee, scoped to
 * employees whose role is "manager" — there's no dedicated "assign manager"
 * endpoint, a manager is just an employee assigned to the project. */
export function AssignManagerModal({ open, onClose, project, candidates, onSubmit, isSubmitting }: AssignManagerModalProps) {
  const [managerId, setManagerId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setManagerId("");
      setError(null);
    }
  }

  function handleSubmit() {
    if (!managerId) {
      setError("Select a manager.");
      return;
    }
    onSubmit(managerId);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign Manager"
      description={project?.name}
      widthClassName="sm:max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            Assign
          </Button>
        </div>
      }
    >
      <FormField label="Manager" htmlFor="assign-manager" error={error ?? undefined} required>
        <FilterDropdown
          label={candidates.length === 0 ? "No eligible managers" : "Select Manager"}
          options={candidates.map((c) => ({ label: `${c.name}${c.employeeId ? ` (${c.employeeId})` : ""}`, value: c.userId }))}
          value={managerId}
          onChange={setManagerId}
        />
      </FormField>
    </Modal>
  );
}
