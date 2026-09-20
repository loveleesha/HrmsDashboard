"use client";

import { useRef, useState } from "react";
import { FileText, UploadCloud, X } from "lucide-react";
import { Modal } from "@/components/molecules/Modal";
import { FormField } from "@/components/molecules/FormField";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { COMPANY_DOCUMENT_CATEGORIES, type CompanyDocumentCategory } from "@/types/company-document";

export interface AddCompanyDocumentValues {
  title: string;
  category: CompanyDocumentCategory;
  file: File;
}

const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";
const MAX_SIZE_MB = 10;

export function AddCompanyDocumentForm({
  open,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: AddCompanyDocumentValues) => void;
  isSubmitting?: boolean;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CompanyDocumentCategory | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);
  const inputRef = useRef<HTMLInputElement>(null);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setTitle("");
      setCategory("");
      setFile(null);
      setError(null);
    }
  }

  function handleFileChange(selected: File | null) {
    if (!selected) {
      setFile(null);
      return;
    }
    if (selected.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File must be ${MAX_SIZE_MB}MB or smaller.`);
      return;
    }
    setError(null);
    setFile(selected);
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
    if (!file) {
      setError("Attach a file (jpeg, png, webp, or pdf).");
      return;
    }
    onSubmit({ title: title.trim(), category, file });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Company Document"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            Publish
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="Title" htmlFor="cdoc-title" required>
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
        <FormField label="File" htmlFor="cdoc-file" error={error ?? undefined} required>
          <input
            ref={inputRef}
            id="cdoc-file"
            type="file"
            accept={ACCEPT}
            className="sr-only"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          />
          {!file ? (
            <label
              htmlFor="cdoc-file"
              className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border-strong px-4 py-6 text-center transition-colors hover:border-primary hover:bg-primary-softer"
            >
              <UploadCloud className="size-5 text-muted-light" />
              <span className="text-fs-base font-medium text-ink">Click to upload</span>
              <span className="text-fs-sm text-muted-light">JPEG, PNG, WEBP, or PDF — up to {MAX_SIZE_MB}MB</span>
            </label>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-card p-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <FileText className="size-5" />
              </span>
              <p className="min-w-0 flex-1 truncate text-fs-base font-medium text-ink">{file.name}</p>
              <Button type="button" variant="ghost" size="sm" onClick={() => handleFileChange(null)} aria-label="Remove file">
                <X className="size-4" />
              </Button>
            </div>
          )}
        </FormField>
      </div>
    </Modal>
  );
}
