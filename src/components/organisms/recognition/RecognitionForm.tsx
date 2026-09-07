"use client";

import { useState } from "react";
import { Modal } from "@/components/molecules/Modal";
import { FormField } from "@/components/molecules/FormField";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { Textarea } from "@/components/atoms/Textarea";
import { Button } from "@/components/atoms/Button";
import { RecognitionBadgeChip } from "@/components/molecules/RecognitionBadgeChip";
import { RECOGNITION_BADGES } from "@/services/recognition.service";
import type { Employee } from "@/types/employee";
import type { BadgeKey } from "@/types/recognition";

export interface RecognitionFormValues {
  employeeId: string;
  badge: BadgeKey;
  message: string;
}

export interface RecognitionFormProps {
  open: boolean;
  onClose: () => void;
  employees: Employee[];
  excludeEmployeeId?: string;
  onSubmit: (values: RecognitionFormValues) => void;
}

export function RecognitionForm({
  open,
  onClose,
  employees,
  excludeEmployeeId,
  onSubmit,
}: RecognitionFormProps) {
  const [employeeId, setEmployeeId] = useState("");
  const [badge, setBadge] = useState<BadgeKey | "">("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ employeeId?: string; badge?: string; message?: string }>({});

  const selectedBadgeDef = RECOGNITION_BADGES.find((b) => b.key === badge);
  const eligibleEmployees = employees.filter((employee) => employee.id !== excludeEmployeeId);

  function resetForm() {
    setEmployeeId("");
    setBadge("");
    setMessage("");
    setErrors({});
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleSubmit() {
    const nextErrors: typeof errors = {};
    if (!employeeId) nextErrors.employeeId = "Select a colleague to recognize.";
    if (!badge) nextErrors.badge = "Select a badge.";
    if (!message.trim()) nextErrors.message = "Write a short message.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit({ employeeId, badge: badge as BadgeKey, message: message.trim() });
    resetForm();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Recognize a colleague"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Send Recognition</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="Employee" htmlFor="recognition-employee" error={errors.employeeId} required>
          <FilterDropdown
            label="Select Employee"
            options={eligibleEmployees.map((employee) => ({
              label: `${employee.name} — ${employee.designation}`,
              value: employee.id,
            }))}
            value={employeeId}
            onChange={setEmployeeId}
          />
        </FormField>

        <FormField label="Badge" htmlFor="recognition-badge" error={errors.badge} required>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {RECOGNITION_BADGES.map((badgeDef) => (
              <RecognitionBadgeChip
                key={badgeDef.key}
                badge={badgeDef}
                selected={badge === badgeDef.key}
                onClick={() => setBadge(badgeDef.key)}
              />
            ))}
          </div>
          {selectedBadgeDef && (
            <p className="mt-2 text-fs-sm text-muted">{selectedBadgeDef.description}</p>
          )}
        </FormField>

        <FormField label="Message" htmlFor="recognition-message" error={errors.message} required>
          <Textarea
            id="recognition-message"
            rows={4}
            placeholder="Write a message…"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            invalid={Boolean(errors.message)}
          />
        </FormField>
      </div>
    </Modal>
  );
}
