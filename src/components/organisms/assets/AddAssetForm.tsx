"use client";

import { useState } from "react";
import { Modal } from "@/components/molecules/Modal";
import { FormField } from "@/components/molecules/FormField";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { ASSET_CATEGORIES } from "@/types/asset";
import { applyTextRules } from "@/lib/validation";

export interface AddAssetFormValues {
  name: string;
  category: string;
  serialNumber?: string;
}

export interface AddAssetFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: AddAssetFormValues) => void;
  isSubmitting?: boolean;
  /** Present → editing an existing asset (Update Asset) instead of creating one. */
  initialValues?: AddAssetFormValues;
}

/** Admin > Assets > Create/Update Asset — name/category/serialNumber only;
 * every other field (status, assignment) is server-managed. */
export function AddAssetForm({ open, onClose, onSubmit, isSubmitting, initialValues }: AddAssetFormProps) {
  const isEdit = Boolean(initialValues);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [wasOpen, setWasOpen] = useState(open);

  // Re-seed on every open — adjusted during render, not an effect, so it
  // happens before paint instead of causing an extra render.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName(initialValues?.name ?? "");
      setCategory(initialValues?.category ?? "");
      setSerialNumber(initialValues?.serialNumber ?? "");
      setErrors({});
    }
  }

  function handleSubmit() {
    const nextErrors: Record<string, string> = {};
    if (!category) nextErrors.category = "Select a category.";

    applyTextRules(nextErrors, {
      name: [name, "Asset name", { min: 2, max: 80 }],
      serialNumber: [serialNumber, "Serial number", { max: 50 }],
    });

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit({ name: name.trim(), category, serialNumber: serialNumber.trim() || undefined });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Asset" : "Add Asset to Inventory"}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            {isEdit ? "Save Changes" : "Add Asset"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="Asset Name" htmlFor="asset-name" error={errors.name} required>
          <Input id="asset-name" value={name} onChange={(e) => setName(e.target.value)} invalid={Boolean(errors.name)} />
        </FormField>
        <FormField label="Category" htmlFor="asset-category" error={errors.category} required>
          <FilterDropdown
            label="Select Category"
            options={ASSET_CATEGORIES.map((c) => ({ label: c, value: c }))}
            value={category}
            onChange={setCategory}
          />
        </FormField>
        <FormField label="Serial No." htmlFor="asset-serial" error={errors.serialNumber}>
          <Input
            id="asset-serial"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            invalid={Boolean(errors.serialNumber)}
          />
        </FormField>
      </div>
    </Modal>
  );
}
