"use client";

import { useState } from "react";
import { Modal } from "@/components/molecules/Modal";
import { FormField } from "@/components/molecules/FormField";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { COMPANY_DOCUMENT_CATEGORIES, type CompanyDocument, type CompanyDocumentCategory } from "@/types/company-document";

export interface EditDocumentValues {
  title: string;
  category: CompanyDocumentCategory;
}

export interface EditDocumentModalProps {
  open: boolean;
  onClose: () => void;
  document: CompanyDocument | null;
  onSubmit: (values: EditDocumentValues) => void;
  isSubmitting?: boolean;
}

/** Admin > Documents > Update Document — title/category only; the file
 * itself can't be replaced here, publish a new document instead. */
export function EditDocumentModal({ open, onClose, document, onSubmit, isSubmitting }: EditDocumentModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CompanyDocumentCategory | "">("");
  const [error, setError] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open && document) {
      setTitle(document.title);
      setCategory(document.category);
      setError(null);
    }
  }

  function handleSubmit() {
    if (!title.trim() || !category) {
      setError("Add a title and pick a category.");
      return;
    }
    onSubmit({ title: title.trim(), category });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Document"
      widthClassName="sm:max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="Title" htmlFor="edit-cdoc-title" error={error ?? undefined} required>
          <Input id="edit-cdoc-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </FormField>
        <FormField label="Category" htmlFor="edit-cdoc-category" required>
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
