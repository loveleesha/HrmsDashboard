"use client";

import { useRef, useState } from "react";
import { CheckCircle2, FileSpreadsheet, UploadCloud, X } from "lucide-react";
import { Modal } from "@/components/molecules/Modal";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { importAttendance } from "@/services/attendance.service";
import type { AttendanceImportSummary } from "@/types/attendance";

const ACCEPT = ".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const MAX_SIZE_MB = 10;

export interface AttendanceImportModalProps {
  open: boolean;
  onClose: () => void;
  /** Called after a successful import so the page can refresh whatever it's showing. */
  onImported?: () => void;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/** Admin > Attendance > "Attendance Upload" — bulk-imports a biometric
 * device's CSV/XLS/XLSX export (one row per employee, one column per day,
 * each cell a newline-separated list of that day's raw punches — see the
 * backend's utils/parseAttendanceImport.js for the exact format). The file's
 * own "Made Date:YYYY/MM/DD-YYYY/MM/DD" line anchors the day-number columns
 * to real dates and caps the span at one month; a file without that line is
 * anchored to the current month instead (so a single day's pull with just a
 * "1" column works too). This modal just surfaces whatever the backend
 * reports back (including a range-too-long error) rather than re-validating.
 */
export function AttendanceImportModal({ open, onClose, onImported }: AttendanceImportModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AttendanceImportSummary | null>(null);

  function reset() {
    setFile(null);
    setError(null);
    setSummary(null);
    setIsUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleFileChange(files: FileList | null) {
    const picked = files?.[0];
    if (!picked) return;
    if (picked.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File must be ${MAX_SIZE_MB}MB or smaller.`);
      return;
    }
    setError(null);
    setSummary(null);
    setFile(picked);
  }

  async function handleUpload() {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      const result = await importAttendance(file);
      setSummary(result);
      onImported?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not import this file.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Attendance Upload"
      description="Upload one biometric device export — one day, a few days, a week, or up to a full month in one file."
      footer={
        summary ? (
          <Button onClick={handleClose}>Done</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={handleClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} isLoading={isUploading} disabled={!file}>
              <UploadCloud className="size-4" />
              Upload
            </Button>
          </>
        )
      }
    >
      {summary ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-success-bg px-3 py-2.5 text-fs-base text-success">
            <CheckCircle2 className="size-4 shrink-0" />
            Imported {formatDate(summary.periodStart)} – {formatDate(summary.periodEnd)}.
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border p-3">
              <p className="text-fs-sm text-muted-light">Rows in file</p>
              <p className="text-fs-xl font-semibold text-ink">{summary.rowsInFile}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-fs-sm text-muted-light">Employees matched</p>
              <p className="text-fs-xl font-semibold text-ink">{summary.employeesMatched}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-fs-sm text-muted-light">Records saved</p>
              <p className="text-fs-xl font-semibold text-ink">{summary.recordsUpserted}</p>
            </div>
          </div>
          {summary.employeesNotFound.length > 0 && (
            <div className="rounded-lg border border-dashed border-warning/50 bg-warning-bg p-3">
              <p className="mb-2 text-fs-sm font-medium text-warning">
                {summary.employeesNotFound.length} employee ID{summary.employeesNotFound.length === 1 ? "" : "s"} in the file didn&apos;t
                match anyone — skipped:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {summary.employeesNotFound.map((id) => (
                  <Badge key={id} tone="warning">
                    {id}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            id="attendance-import-file"
            disabled={isUploading}
            onChange={(e) => handleFileChange(e.target.files)}
          />

          {!file ? (
            <label
              htmlFor="attendance-import-file"
              className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border-strong px-4 py-10 text-center transition-colors hover:border-primary hover:bg-primary-softer"
            >
              <UploadCloud className="size-6 text-muted-light" />
              <span className="text-fs-base font-medium text-ink">Click to choose a file</span>
              <span className="text-fs-sm text-muted-light">CSV, XLS, or XLSX — up to {MAX_SIZE_MB}MB</span>
            </label>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-card p-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <FileSpreadsheet className="size-5" />
              </span>
              <p className="min-w-0 flex-1 truncate text-fs-base font-medium text-ink">{file.name}</p>
              {!isUploading && (
                <Button type="button" variant="ghost" size="sm" onClick={reset} aria-label="Remove file">
                  <X className="size-4" />
                </Button>
              )}
            </div>
          )}

          {error && <p className="text-fs-sm text-danger">{error}</p>}

          <p className="text-fs-sm text-muted">
            If the file has a &ldquo;Made Date:YYYY/MM/DD-YYYY/MM/DD&rdquo; line, that range is used (max one month) — otherwise it&apos;s
            assumed to be the current month. For each day, the first recorded punch is taken as check-in and the last as check-out.
          </p>
        </div>
      )}
    </Modal>
  );
}
