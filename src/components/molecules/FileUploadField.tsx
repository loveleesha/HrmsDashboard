"use client";

import { useId, useRef, useState } from "react";
import { FileText, Loader2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/cn";

export interface FileUploadValue {
  fileName: string;
  previewUrl?: string;
  /** The real, uploaded URL — set once `onUpload` resolves. */
  url?: string;
}

export interface FileUploadFieldProps {
  label?: string;
  value?: FileUploadValue;
  onChange: (value: FileUploadValue | null) => void;
  /**
   * When provided, the field uploads the file itself — showing a busy state
   * while in flight — and only calls `onChange` (with `url` set) once the
   * upload actually succeeds. Without it, `onChange` fires immediately with
   * just the local file name/preview (no real upload happens).
   */
  onUpload?: (file: File) => Promise<string>;
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
  onUpload,
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
  const [isUploading, setIsUploading] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [trackedPreviewUrl, setTrackedPreviewUrl] = useState(value?.previewUrl);

  if (value?.previewUrl !== trackedPreviewUrl) {
    setTrackedPreviewUrl(value?.previewUrl);
    setPreviewFailed(false);
  }

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    if (file.size > maxSizeMb * 1024 * 1024) {
      setLocalError(`File must be ${maxSizeMb}MB or smaller.`);
      return;
    }

    setLocalError(null);
    const previewUrl = imagePreview ? await readFileAsDataUrl(file) : undefined;

    if (!onUpload) {
      onChange({ fileName: file.name, previewUrl });
      return;
    }

    setIsUploading(true);
    try {
      const url = await onUpload(file);
      onChange({ fileName: file.name, previewUrl, url });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  function handleRemove() {
    onChange(null);
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  // A resumed record's previewUrl points at a remote asset (unlike a
  // freshly-selected file's local blob/data URL), which can 404 or be
  // unreachable — fall back to the generic file row instead of a broken
  // image icon. Reset whenever the value changes so a new file gets a
  // fresh attempt.
  const showImagePreview = imagePreview && value?.previewUrl && !previewFailed;

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
        disabled={isUploading}
        onChange={(event) => handleFiles(event.target.files)}
      />

      {isUploading ? (
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-border-strong px-4 py-6">
          <Loader2 className="size-5 animate-spin text-primary" />
          <span className="text-fs-base text-muted">Uploading…</span>
        </div>
      ) : !value ? (
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
      ) : showImagePreview ? (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-card p-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob/data URL preview or a remote asset, not optimizable by next/image without domain config */}
          <img
            src={value.previewUrl}
            alt="Preview"
            onError={() => setPreviewFailed(true)}
            className="size-16 shrink-0 rounded-lg object-cover"
          />
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