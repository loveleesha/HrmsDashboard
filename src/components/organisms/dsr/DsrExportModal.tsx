"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Modal } from "@/components/molecules/Modal";
import { Button } from "@/components/atoms/Button";
import { DatePickerField } from "@/components/molecules/DatePickerField";
import { FormField } from "@/components/molecules/FormField";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { useToast } from "@/hooks/use-toast";
import { exportDsr } from "@/services/dsr.service";
import { listAllProjects } from "@/services/project.service";
import type { ApiProject } from "@/types/project";
import { todayKey } from "@/lib/validation";

/** Matches the backend's own cap (controllers/Admin/projectController.js's
 * exportDsr) — kept in sync here so the admin sees the problem before
 * submitting rather than only after a 400 comes back. */
const MAX_RANGE_DAYS = 31;

function daysAgoKey(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function spanDays(fromDate: string, toDate: string): number {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  return Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
}

export interface DsrExportModalProps {
  open: boolean;
  onClose: () => void;
}

/** Admin > DSR > All Worksheets' "Export CSV" — a date range (required,
 * capped at MAX_RANGE_DAYS) and an optional single-project filter, matching
 * the filters already available on the worksheets list itself. */
export function DsrExportModal({ open, onClose }: DsrExportModalProps) {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<ApiProject[]>([]);
  // Defaults to the last 30 days, ending today — already within the cap so
  // exporting with no adjustment at all just works.
  const [fromDate, setFromDate] = useState(() => daysAgoKey(29));
  const [toDate, setToDate] = useState(() => todayKey());
  const [project, setProject] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!open) return;
    let isMounted = true;
    // listAllProjects (not listProjects) — every dsr.export holder sees every
    // created project here regardless of projects.view, same as every other
    // project picker in the DSR module.
    listAllProjects()
      .then((data) => isMounted && setProjects(data))
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [open]);

  const rangeInvalid = Boolean(fromDate && toDate && toDate < fromDate);
  const rangeTooLong = Boolean(fromDate && toDate && !rangeInvalid && spanDays(fromDate, toDate) > MAX_RANGE_DAYS);
  const rangeError = !fromDate || !toDate ? "Pick both a start and end date." : rangeInvalid ? "End date can't be before the start date." : rangeTooLong ? `The range can't exceed ${MAX_RANGE_DAYS} days (about one month) — narrow it to export.` : undefined;

  async function handleExport() {
    if (rangeError) return;
    setIsExporting(true);
    try {
      await exportDsr({ fromDate, toDate, ...(project ? { project } : {}) });
      showToast("DSR export downloaded.");
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not export DSR data.", "error");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Export DSR as CSV"
      description="Choose a date range (at most one month) and, optionally, one project to narrow the export."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} isLoading={isExporting} disabled={Boolean(rangeError)}>
            <Download className="size-4" />
            Export CSV
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DatePickerField label="From Date" value={fromDate} max={toDate || todayKey()} onChange={(e) => setFromDate(e.target.value)} required />
          <DatePickerField label="To Date" value={toDate} min={fromDate || undefined} max={todayKey()} onChange={(e) => setToDate(e.target.value)} required />
        </div>
        {rangeError && <p className="text-fs-sm text-danger">{rangeError}</p>}

        <FormField label="Project" htmlFor="dsr-export-project" hint="Leave as All Projects to include every project (and Miscellaneous entries).">
          <FilterDropdown
            label="All Projects"
            ariaLabel="Export project filter"
            options={projects.map((p) => ({ label: p.name, value: p.id }))}
            value={project}
            onChange={setProject}
          />
        </FormField>
      </div>
    </Modal>
  );
}
