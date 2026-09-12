"use client";

import { useId, useRef, useState } from "react";
import { FileText, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/cn";

export interface FileUploadValue {
  fileName: string;
  previewUrl?: string;
}

export interface FileUploadFieldProps {
  label?: string;
  value?: FileUploadValue;
  onChange: (value: FileUploadValue | null) => void;
  accept?: string;
  maxSizeMb?: number;
  /** Renders an image thumbnail instead of a generic file row. */
  imagePreview?: boolean;
  error?: string;
  hint?: string;
  className?: string;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function FileUploadField({
  label,
  value,
  onChange,
  accept,
  maxSizeMb = 5,
  imagePreview = false,
  error,
  hint,
  className,
}: FileUploadFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    if (file.size > maxSizeMb * 1024 * 1024) {
      setLocalError(`File must be ${maxSizeMb}MB or smaller.`);
      return;
    }

    setLocalError(null);
    const previewUrl = imagePreview ? await readFileAsDataUrl(file) : undefined;
    onChange({ fileName: file.name, previewUrl });
  }

  function handleRemove() {
    onChange(null);
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const displayError = error ?? localError ?? undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={inputId} className="text-fs-base font-medium text-ink">
          {label}
        </label>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => handleFiles(event.target.files)}
      />

      {!value ? (
        <label
          htmlFor={inputId}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-4 py-6 text-center transition-colors hover:border-primary hover:bg-primary-softer",
            displayError ? "border-danger" : "border-border-strong"
          )}
        >
          <UploadCloud className="size-5 text-muted-light" />
          <span className="text-fs-base font-medium text-ink">Click to upload</span>
          <span className="text-fs-sm text-muted-light">
            {accept ? accept.replaceAll(",", ", ") : "Any file"} up to {maxSizeMb}MB
          </span>
        </label>
      ) : imagePreview && value.previewUrl ? (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-card p-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob/data URL preview, not an optimizable remote asset */}
          <img src={value.previewUrl} alt="Preview" className="size-16 shrink-0 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-fs-base font-medium text-ink">{value.fileName}</p>
            <p className="text-fs-sm text-muted-light">Uploaded</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
              Replace
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={handleRemove} aria-label="Remove image">
              <X className="size-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-card p-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <FileText className="size-5" />
          </span>
          <p className="min-w-0 flex-1 truncate text-fs-base font-medium text-ink">{value.fileName}</p>
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
              Replace
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={handleRemove} aria-label="Remove file">
              <X className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {displayError ? (
        <p className="text-fs-sm text-danger">{displayError}</p>
      ) : hint ? (
        <p className="text-fs-sm text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
