"use client";

import { useState } from "react";
import { Modal } from "@/components/molecules/Modal";
import { FormField } from "@/components/molecules/FormField";
import { DatePickerField } from "@/components/molecules/DatePickerField";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { applyTextRules } from "@/lib/validation";
import type { Candidate } from "@/types/recruitment";

export interface ScheduleInterviewValues {
  date: string;
  time: string;
  interviewer: string;
}

export interface ScheduleInterviewModalProps {
  open: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  onSubmit: (values: ScheduleInterviewValues) => void;
  isSubmitting?: boolean;
}

/** Admin > Recruitment > Schedule Interview — job is denormalized from the
 * candidate automatically; always created with status "Scheduled". */
export function ScheduleInterviewModal({ open, onClose, candidate, onSubmit, isSubmitting }: ScheduleInterviewModalProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [interviewer, setInterviewer] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDate("");
      setTime("");
      setInterviewer("");
      setErrors({});
    }
  }

  function handleSubmit() {
    const nextErrors: Record<string, string> = {};
    if (!date) nextErrors.date = "Select a date.";
    if (!time) nextErrors.time = "Select a time.";
    applyTextRules(nextErrors, { interviewer: [interviewer, "Interviewer", { min: 2, max: 60 }] });
    if (!interviewer.trim()) nextErrors.interviewer = "Interviewer name is required.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit({ date, time, interviewer: interviewer.trim() });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Schedule Interview"
      description={candidate ? `${candidate.name} · ${candidate.jobTitle}` : undefined}
      widthClassName="sm:max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            Schedule
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DatePickerField label="Date" value={date} onChange={(e) => setDate(e.target.value)} error={errors.date} />
          <FormField label="Time" htmlFor="interview-time" error={errors.time} required>
            <Input id="interview-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} invalid={Boolean(errors.time)} />
          </FormField>
        </div>
        <FormField label="Interviewer" htmlFor="interview-interviewer" error={errors.interviewer} required>
          <Input id="interview-interviewer" value={interviewer} onChange={(e) => setInterviewer(e.target.value)} invalid={Boolean(errors.interviewer)} />
        </FormField>
      </div>
    </Modal>
  );
}
