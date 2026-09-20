"use client";

import { useState } from "react";
import { Modal } from "@/components/molecules/Modal";
import { FormField } from "@/components/molecules/FormField";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { DEPARTMENTS } from "@/types/employee";
import { JOB_TYPES, type JobType } from "@/types/recruitment";
import { applyTextRules } from "@/lib/validation";

export interface AddJobFormValues {
  title: string;
  department: string;
  location: string;
  type: JobType;
  openings: number;
  experience: string;
}

export interface AddJobFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: AddJobFormValues) => void;
}

export function AddJobForm({ open, onClose, onSubmit }: AddJobFormProps) {
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState<JobType | "">("");
  const [openings, setOpenings] = useState("1");
  const [experience, setExperience] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function reset() {
    setTitle("");
    setDepartment("");
    setLocation("");
    setType("");
    setOpenings("1");
    setExperience("");
    setErrors({});
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit() {
    const nextErrors: Record<string, string> = {};
    if (!title.trim()) nextErrors.title = "Job title is required.";
    if (!department) nextErrors.department = "Select a department.";
    if (!location.trim()) nextErrors.location = "Location is required.";
    if (!type) nextErrors.type = "Select a job type.";
    if (!experience.trim()) nextErrors.experience = "Add an experience range, e.g. 2-4 years.";
    const openingsNum = Number(openings);
    if (!openingsNum || openingsNum < 1) nextErrors.openings = "Must have at least 1 opening.";

    applyTextRules(nextErrors, {
      title: [title, "Job title", { min: 2, max: 100 }],
      location: [location, "Location", { max: 80 }],
      experience: [experience, "Experience", { max: 30 }],
    });
    if (openingsNum > 999 && !nextErrors.openings) nextErrors.openings = "Openings can't be more than 999.";
    if (!Number.isInteger(openingsNum) && !nextErrors.openings) nextErrors.openings = "Openings must be a whole number.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit({
      title: title.trim(),
      department,
      location: location.trim(),
      type: type as JobType,
      openings: openingsNum,
      experience: experience.trim(),
    });
    reset();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Post a New Job"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Post Job</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="Job Title" htmlFor="job-title" error={errors.title} required>
          <Input
            id="job-title"
            placeholder="e.g. Senior Backend Engineer"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            invalid={Boolean(errors.title)}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Department" htmlFor="job-department" error={errors.department} required>
            <FilterDropdown
              label="Select Department"
              options={DEPARTMENTS.map((d) => ({ label: d, value: d }))}
              value={department}
              onChange={setDepartment}
            />
          </FormField>
          <FormField label="Job Type" htmlFor="job-type" error={errors.type} required>
            <FilterDropdown
              label="Select Type"
              options={JOB_TYPES.map((t) => ({ label: t, value: t }))}
              value={type}
              onChange={(value) => setType(value as JobType)}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Location" htmlFor="job-location" error={errors.location} required>
            <Input
              id="job-location"
              placeholder="e.g. Bangalore or Remote"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              invalid={Boolean(errors.location)}
            />
          </FormField>
          <FormField label="Openings" htmlFor="job-openings" error={errors.openings} required>
            <Input
              id="job-openings"
              type="number"
              min={1}
              value={openings}
              onChange={(event) => setOpenings(event.target.value)}
              invalid={Boolean(errors.openings)}
            />
          </FormField>
        </div>

        <FormField label="Experience Range" htmlFor="job-experience" error={errors.experience} required>
          <Input
            id="job-experience"
            placeholder="e.g. 3-5 years"
            value={experience}
            onChange={(event) => setExperience(event.target.value)}
            invalid={Boolean(errors.experience)}
          />
        </FormField>
      </div>
    </Modal>
  );
}
