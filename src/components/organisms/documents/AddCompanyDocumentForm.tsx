"use client";

import { useState } from "react";
import { Modal } from "@/components/molecules/Modal";
import { FormField } from "@/components/molecules/FormField";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { COMPANY_DOCUMENT_CATEGORIES, type CompanyDocumentCategory } from "@/types/company-document";

export interface AddCompanyDocumentValues {
  title: string;
  category: CompanyDocumentCategory;
}

export function AddCompanyDocumentForm({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: AddCompanyDocumentValues) => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CompanyDocumentCategory | "">("");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setTitle("");
    setCategory("");
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit() {
    if (!title.trim() || !category) {
      setError("Add a title and pick a category.");
      return;
    }
    if (title.trim().length > 120) {
      setError("Title must be 120 characters or fewer.");
      return;
    }
    onSubmit({ title: title.trim(), category });
    reset();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Company Document"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Publish</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="Title" htmlFor="cdoc-title" error={error ?? undefined} required>
          <Input id="cdoc-title" placeholder="e.g. Remote Work Policy" value={title} onChange={(e) => setTitle(e.target.value)} />
        </FormField>
        <FormField label="Category" htmlFor="cdoc-category" required>
          <FilterDropdown
            label="Select Category"
            options={COMPANY_DOCUMENT_CATEGORIES.map((c) => ({ label: c, value: c }))}
            value={category}
            onChange={(v) => setCategory(v as CompanyDocumentCategory)}
          />
        </FormField>
      </div>
    </Modal>
  );
}
