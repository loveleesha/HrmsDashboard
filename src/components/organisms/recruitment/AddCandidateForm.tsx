"use client";

import { useState } from "react";
import { Modal } from "@/components/molecules/Modal";
import { FormField } from "@/components/molecules/FormField";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { applyTextRules, isValidEmail } from "@/lib/validation";
import type { JobPosting } from "@/types/recruitment";

export interface AddCandidateFormValues {
  name: string;
  email: string;
  phone: string;
  jobId: string;
}

export interface AddCandidateFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: AddCandidateFormValues) => void;
  jobs: JobPosting[];
  isSubmitting?: boolean;
}

/** Admin > Recruitment > Add Candidate to Pipeline — always created at stage "Applied". */
export function AddCandidateForm({ open, onClose, onSubmit, jobs, isSubmitting }: AddCandidateFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobId, setJobId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName("");
      setEmail("");
      setPhone("");
      setJobId("");
      setErrors({});
    }
  }

  function handleSubmit() {
    const nextErrors: Record<string, string> = {};
    if (!jobId) nextErrors.jobId = "Select the job this candidate applied to.";
    if (!phone.trim()) nextErrors.phone = "Phone number is required.";
    if (!email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!isValidEmail(email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    applyTextRules(nextErrors, { name: [name, "Name", { min: 2, max: 80 }] });

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit({ name: name.trim(), email: email.trim(), phone: phone.trim(), jobId });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Candidate to Pipeline"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            Add Candidate
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="Job" htmlFor="candidate-job" error={errors.jobId} required>
          <FilterDropdown label="Select Job" options={jobs.map((j) => ({ label: j.title, value: j.id }))} value={jobId} onChange={setJobId} />
        </FormField>
        <FormField label="Full Name" htmlFor="candidate-name" error={errors.name} required>
          <Input id="candidate-name" value={name} onChange={(e) => setName(e.target.value)} invalid={Boolean(errors.name)} />
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Email" htmlFor="candidate-email" error={errors.email} required>
            <Input id="candidate-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} invalid={Boolean(errors.email)} />
          </FormField>
          <FormField label="Phone" htmlFor="candidate-phone" error={errors.phone} required>
            <Input id="candidate-phone" value={phone} onChange={(e) => setPhone(e.target.value)} invalid={Boolean(errors.phone)} />
          </FormField>
        </div>
      </div>
    </Modal>
  );
}
