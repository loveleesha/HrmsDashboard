"use client";

import { useState } from "react";
import { Modal } from "@/components/molecules/Modal";
import { FormField } from "@/components/molecules/FormField";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";

export interface UploadDocumentValues {
  name: string;
  category: string;
}

const CATEGORIES = ["Identity", "Employment", "Financial", "Education", "Other"];

export function UploadDocumentForm({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: UploadDocumentValues) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName("");
    setCategory("");
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit() {
    if (!name.trim() || !category) {
      setError("Choose a file name and category.");
      return;
    }
    onSubmit({ name: name.trim(), category });
    reset();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Upload Document"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Upload</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="Document Name" htmlFor="doc-name" error={error ?? undefined} required>
          <Input id="doc-name" placeholder="e.g. Address Proof.pdf" value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label="Category" htmlFor="doc-category" required>
          <FilterDropdown label="Select Category" options={CATEGORIES.map((c) => ({ label: c, value: c }))} value={category} onChange={setCategory} />
        </FormField>
      </div>
    </Modal>
  );
}
