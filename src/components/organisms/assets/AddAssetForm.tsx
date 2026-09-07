"use client";

import { useState } from "react";
import { Modal } from "@/components/molecules/Modal";
import { FormField } from "@/components/molecules/FormField";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { ASSET_CATEGORIES } from "@/types/asset";

export interface AddAssetFormValues {
  assetName: string;
  category: string;
  brand: string;
  serialNo: string;
  model: string;
}

export interface AddAssetFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: AddAssetFormValues) => void;
}

export function AddAssetForm({ open, onClose, onSubmit }: AddAssetFormProps) {
  const [assetName, setAssetName] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [serialNo, setSerialNo] = useState("");
  const [model, setModel] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function reset() {
    setAssetName("");
    setCategory("");
    setBrand("");
    setSerialNo("");
    setModel("");
    setErrors({});
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit() {
    const nextErrors: Record<string, string> = {};
    if (!assetName.trim()) nextErrors.assetName = "Asset name is required.";
    if (!category) nextErrors.category = "Select a category.";
    if (!brand.trim()) nextErrors.brand = "Brand is required.";
    if (!serialNo.trim()) nextErrors.serialNo = "Serial number is required.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit({ assetName: assetName.trim(), category, brand: brand.trim(), serialNo: serialNo.trim(), model: model.trim() });
    reset();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Asset to Inventory"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add Asset</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="Asset Name" htmlFor="asset-name" error={errors.assetName} required>
          <Input id="asset-name" value={assetName} onChange={(e) => setAssetName(e.target.value)} invalid={Boolean(errors.assetName)} />
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Category" htmlFor="asset-category" error={errors.category} required>
            <FilterDropdown
              label="Select Category"
              options={ASSET_CATEGORIES.map((c) => ({ label: c, value: c }))}
              value={category}
              onChange={setCategory}
            />
          </FormField>
          <FormField label="Brand" htmlFor="asset-brand" error={errors.brand} required>
            <Input id="asset-brand" value={brand} onChange={(e) => setBrand(e.target.value)} invalid={Boolean(errors.brand)} />
          </FormField>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Serial No." htmlFor="asset-serial" error={errors.serialNo} required>
            <Input id="asset-serial" value={serialNo} onChange={(e) => setSerialNo(e.target.value)} invalid={Boolean(errors.serialNo)} />
          </FormField>
          <FormField label="Model" htmlFor="asset-model">
            <Input id="asset-model" value={model} onChange={(e) => setModel(e.target.value)} />
          </FormField>
        </div>
      </div>
    </Modal>
  );
}
