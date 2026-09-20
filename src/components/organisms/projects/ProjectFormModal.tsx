"use client";

import { useState } from "react";
import { Modal } from "@/components/molecules/Modal";
import { FormField } from "@/components/molecules/FormField";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { Input } from "@/components/atoms/Input";
import { Textarea } from "@/components/atoms/Textarea";
import { Button } from "@/components/atoms/Button";
import { textError } from "@/lib/validation";
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName(project?.name ?? "");
      setDescription(project?.description ?? "");
      setLead(project?.lead ?? "");
      setStatus(project?.status ?? "active");
      setErrors({});
    }
  }

  async function handleSubmit() {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = "Project name is required.";
    const nameIssue = textError(name, "Project name", { min: 2, max: 80 });
    if (nameIssue && !nextErrors.name) nextErrors.name = nameIssue;
    const descriptionIssue = textError(description, "Description", { max: 500 });
    if (descriptionIssue) nextErrors.description = descriptionIssue;
    const leadIssue = textError(lead, "Project lead", { max: 60 });
    if (leadIssue) nextErrors.lead = leadIssue;
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
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
        <FormField label="Project Name" htmlFor="projectName" required error={errors.name}>
          <Input id="projectName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. HRMS Revamp" />
        </FormField>
        <FormField label="Description" htmlFor="projectDescription" error={errors.description}>
          <Textarea id="projectDescription" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </FormField>
        {isEdit && (
          <>
            <FormField label="Project Lead" htmlFor="projectLead" error={errors.lead}>
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
