"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/molecules/Modal";
import { FormField } from "@/components/molecules/FormField";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { DatePickerField } from "@/components/molecules/DatePickerField";
import { Textarea } from "@/components/atoms/Textarea";
import { Button } from "@/components/atoms/Button";
import { calculateLeaveDays } from "@/services/leave.service";
import { LEAVE_TYPES, type LeaveType } from "@/types/leave";
import { applyTextRules } from "@/lib/validation";

export interface LeaveRequestFormValues {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
}

export interface LeaveRequestFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: LeaveRequestFormValues) => void;
  isSubmitting?: boolean;
}

export function LeaveRequestForm({ open, onClose, onSubmit, isSubmitting }: LeaveRequestFormProps) {
  const [leaveType, setLeaveType] = useState<LeaveType | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const days = useMemo(() => calculateLeaveDays(startDate, endDate), [startDate, endDate]);

  function resetForm() {
    setLeaveType("");
    setStartDate("");
    setEndDate("");
    setReason("");
    setErrors({});
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleSubmit() {
    const nextErrors: Record<string, string> = {};
    if (!leaveType) nextErrors.leaveType = "Select a leave type.";
    if (!startDate) nextErrors.startDate = "Select a start date.";
    if (!endDate) nextErrors.endDate = "Select an end date.";
    if (startDate && endDate && endDate < startDate) nextErrors.endDate = "End date must be after start date.";
    if (startDate && endDate && endDate >= startDate && days === 0) {
      nextErrors.endDate = "Selected range has no working days.";
    }
    if (!reason.trim()) nextErrors.reason = "Add a reason for your leave request.";

    applyTextRules(nextErrors, { reason: [reason, "Reason", { min: 5, max: 500 }] });

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit({ leaveType: leaveType as LeaveType, startDate, endDate, days, reason: reason.trim() });
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Apply for Leave"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            Submit Request
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="Leave Type" htmlFor="leave-type" error={errors.leaveType} required>
          <FilterDropdown
            label="Select Leave Type"
            options={LEAVE_TYPES.map((type) => ({ label: type, value: type }))}
            value={leaveType}
            onChange={(value) => setLeaveType(value as LeaveType)}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DatePickerField
            label="Start Date"
            value={startDate}
            onChange={(event) => {
              setStartDate(event.target.value);
              if (endDate && event.target.value > endDate) setEndDate(event.target.value);
            }}
            error={errors.startDate}
          />
          <DatePickerField
            label="End Date"
            value={endDate}
            min={startDate || undefined}
            onChange={(event) => setEndDate(event.target.value)}
            error={errors.endDate}
          />
        </div>

        {days > 0 && (
          <p className="rounded-lg bg-primary-softer px-3 py-2 text-fs-base text-primary">
            This request covers <span className="font-semibold">{days}</span> working{" "}
            {days === 1 ? "day" : "days"}.
          </p>
        )}

        <FormField label="Reason" htmlFor="leave-reason" error={errors.reason} required>
          <Textarea
            id="leave-reason"
            rows={4}
            placeholder="Let your manager know why you're taking leave…"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            invalid={Boolean(errors.reason)}
          />
        </FormField>
      </div>
    </Modal>
  );
}
