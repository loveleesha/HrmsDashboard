"use client";

import { useState } from "react";
import { Modal } from "@/components/molecules/Modal";
import { FormField } from "@/components/molecules/FormField";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { Textarea } from "@/components/atoms/Textarea";
import { Button } from "@/components/atoms/Button";
import { ASSET_CATEGORIES } from "@/types/asset";
import type { AssetRequestPriority } from "@/types/asset";
import { applyTextRules } from "@/lib/validation";

export interface RequestAssetFormValues {
  category: string;
  reason: string;
  priority: AssetRequestPriority;
  allocationType: "New" | "Replacement";
}

export interface RequestAssetFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: RequestAssetFormValues) => void;
}

export function RequestAssetForm({ open, onClose, onSubmit }: RequestAssetFormProps) {
  const [category, setCategory] = useState("");
  const [reason, setReason] = useState("");
  const [priority, setPriority] = useState<AssetRequestPriority | "">("");
  const [allocationType, setAllocationType] = useState<"New" | "Replacement" | "">("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function reset() {
    setCategory("");
    setReason("");
    setPriority("");
    setAllocationType("");
    setErrors({});
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit() {
    const nextErrors: Record<string, string> = {};
    if (!category) nextErrors.category = "Select an asset category.";
    if (!reason.trim()) nextErrors.reason = "Explain why you need this asset.";
    if (!priority) nextErrors.priority = "Select a priority.";
    if (!allocationType) nextErrors.allocationType = "Select allocation type.";

    applyTextRules(nextErrors, { reason: [reason, "Reason", { min: 5, max: 500 }] });

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit({
      category,
      reason: reason.trim(),
      priority: priority as AssetRequestPriority,
      allocationType: allocationType as "New" | "Replacement",
    });
    reset();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Request an Asset"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Submit Request</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Asset Category" htmlFor="req-category" error={errors.category} required>
            <FilterDropdown
              label="Select Category"
              options={ASSET_CATEGORIES.map((c) => ({ label: c, value: c }))}
              value={category}
              onChange={setCategory}
            />
          </FormField>
          <FormField label="Allocation Type" htmlFor="req-allocation" error={errors.allocationType} required>
            <FilterDropdown
              label="Select Type"
              options={[
                { label: "New", value: "New" },
                { label: "Replacement", value: "Replacement" },
              ]}
              value={allocationType}
              onChange={(v) => setAllocationType(v as "New" | "Replacement")}
            />
          </FormField>
        </div>
        <FormField label="Priority" htmlFor="req-priority" error={errors.priority} required>
          <FilterDropdown
            label="Select Priority"
            options={[
              { label: "Low", value: "Low" },
              { label: "Medium", value: "Medium" },
              { label: "High", value: "High" },
            ]}
            value={priority}
            onChange={(v) => setPriority(v as AssetRequestPriority)}
          />
        </FormField>
        <FormField label="Reason" htmlFor="req-reason" error={errors.reason} required>
          <Textarea id="req-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} invalid={Boolean(errors.reason)} />
        </FormField>
      </div>
    </Modal>
  );
}
