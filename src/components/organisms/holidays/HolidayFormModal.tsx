"use client";

import { useState } from "react";
import { Modal } from "@/components/molecules/Modal";
import { FormField } from "@/components/molecules/FormField";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { Input } from "@/components/atoms/Input";
import { Textarea } from "@/components/atoms/Textarea";
import { Button } from "@/components/atoms/Button";
import { HOLIDAY_TYPES, HOLIDAY_TYPE_LABELS, type Holiday, type HolidayPayload } from "@/types/holiday";

export interface HolidayFormModalProps {
  open: boolean;
  onClose: () => void;
  holiday?: Holiday;
  onSubmit: (payload: HolidayPayload) => Promise<void>;
  isSubmitting?: boolean;
}

const TYPE_OPTIONS = HOLIDAY_TYPES.map((type) => ({ label: HOLIDAY_TYPE_LABELS[type], value: type }));

export function HolidayFormModal({ open, onClose, holiday, onSubmit, isSubmitting }: HolidayFormModalProps) {
  const isEdit = Boolean(holiday);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<string>("public");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);

  // Re-seed the fields from `holiday` on every open (not just once at mount)
  // so the same modal instance shows the right values whether it's opening
  // fresh for "Add" or pre-filled for "Edit" — adjusted during render, not an
  // effect, so it happens before paint instead of causing an extra render.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName(holiday?.name ?? "");
      setDate(holiday?.date.slice(0, 10) ?? "");
      setType(holiday?.type ?? "public");
      setDescription(holiday?.description ?? "");
      setError(null);
    }
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Holiday name is required.");
      return;
    }
    if (!date) {
      setError("Date is required.");
      return;
    }
    setError(null);
    await onSubmit({
      name: name.trim(),
      date,
      type: type as HolidayPayload["type"],
      description: description.trim() || undefined,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Holiday" : "Add Holiday"}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            {isEdit ? "Save Changes" : "Add Holiday"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="Holiday Name" htmlFor="holidayName" required error={error && !name.trim() ? error : undefined}>
          <Input id="holidayName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Republic Day" />
        </FormField>
        <FormField label="Date" htmlFor="holidayDate" required error={error && !date ? error : undefined}>
          <Input id="holidayDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </FormField>
        <FormField label="Type" htmlFor="holidayType">
          <FilterDropdown label="Type" options={TYPE_OPTIONS} value={type} onChange={setType} />
        </FormField>
        <FormField label="Description" htmlFor="holidayDescription">
          <Textarea id="holidayDescription" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </FormField>
      </div>
    </Modal>
  );
}
