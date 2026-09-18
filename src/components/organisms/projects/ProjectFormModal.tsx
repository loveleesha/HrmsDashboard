"use client";

import { useState } from "react";
import { Modal } from "@/components/molecules/Modal";
import { FormField } from "@/components/molecules/FormField";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { Input } from "@/components/atoms/Input";
import { Textarea } from "@/components/atoms/Textarea";
import { Button } from "@/components/atoms/Button";
import type { ApiProject, CreateProjectPayload, ProjectStatus, UpdateProjectPayload } from "@/types/project";

export interface ProjectFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Present in edit mode. Editing also exposes lead/status, which the create endpoint doesn't accept. */
  project?: ApiProject;
  onCreate: (payload: CreateProjectPayload) => Promise<void>;
  onUpdate: (id: string, payload: UpdateProjectPayload) => Promise<void>;
  isSubmitting?: boolean;
}

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

export function ProjectFormModal({ open, onClose, project, onCreate, onUpdate, isSubmitting }: ProjectFormModalProps) {
  const isEdit = Boolean(project);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [lead, setLead] = useState("");
  const [status, setStatus] = useState("active");
  const [error, setError] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName(project?.name ?? "");
      setDescription(project?.description ?? "");
      setLead(project?.lead ?? "");
      setStatus(project?.status ?? "active");
      setError(null);
    }
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }
    setError(null);
    if (isEdit && project) {
      await onUpdate(project.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        lead: lead.trim() || undefined,
        status: status as ProjectStatus,
      });
    } else {
      await onCreate({ name: name.trim(), description: description.trim() || undefined });
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Project" : "Add Project"}
      description={isEdit ? undefined : "Project names must be unique."}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            {isEdit ? "Save Changes" : "Add Project"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="Project Name" htmlFor="projectName" required error={error ?? undefined}>
          <Input id="projectName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. HRMS Revamp" />
        </FormField>
        <FormField label="Description" htmlFor="projectDescription">
          <Textarea id="projectDescription" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </FormField>
        {isEdit && (
          <>
            <FormField label="Project Lead" htmlFor="projectLead">
              <Input id="projectLead" value={lead} onChange={(e) => setLead(e.target.value)} placeholder="e.g. Priya Nair" />
            </FormField>
            <FormField label="Status" htmlFor="projectStatus">
              <FilterDropdown label="Status" options={STATUS_OPTIONS} value={status} onChange={setStatus} />
            </FormField>
          </>
        )}
      </div>
    </Modal>
  );
}
