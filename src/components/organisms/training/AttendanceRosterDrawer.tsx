"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Drawer } from "@/components/molecules/Drawer";
import { Avatar } from "@/components/atoms/Avatar";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { cn } from "@/lib/cn";
import type { AttendanceStatus, TrainingAttendanceEntry, TrainingProgram } from "@/types/training";

export interface AttendanceRosterDrawerProps {
  open: boolean;
  onClose: () => void;
  training: TrainingProgram | null;
  roster: TrainingAttendanceEntry[] | null;
  onSave: (entries: { employeeId: string; status: AttendanceStatus }[]) => Promise<void>;
  isSaving?: boolean;
}

/** Admin > Training > Get Attendance Roster / Mark Attendance — every
 * employee whose account role matches the training's role, with a
 * Present/Absent toggle per row; only rows the admin actually touched are
 * submitted. */
export function AttendanceRosterDrawer({ open, onClose, training, roster, onSave, isSaving }: AttendanceRosterDrawerProps) {
  const [draft, setDraft] = useState<Record<string, AttendanceStatus>>({});
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft({});
  }

  function setStatus(employeeId: string, status: AttendanceStatus) {
    setDraft((prev) => ({ ...prev, [employeeId]: status }));
  }

  async function handleSave() {
    const entries = Object.entries(draft).map(([employeeId, status]) => ({ employeeId, status }));
    if (entries.length === 0) return;
    await onSave(entries);
  }

  const dirtyCount = Object.keys(draft).length;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Attendance"
      description={training ? `${training.topic} · ${training.trainer}` : undefined}
      widthClassName="sm:max-w-lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Close
          </Button>
          <Button onClick={handleSave} isLoading={isSaving} disabled={dirtyCount === 0}>
            Save Attendance{dirtyCount > 0 ? ` (${dirtyCount})` : ""}
          </Button>
        </div>
      }
    >
      {roster === null ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted">
          <Spinner />
          Loading roster…
        </div>
      ) : roster.length === 0 ? (
        <p className="py-16 text-center text-fs-base text-muted">No employees are eligible for this training&apos;s role.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {roster.map((entry) => {
            const current = draft[entry.employeeId] ?? entry.status;
            return (
              <div key={entry.employeeId} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <Avatar name={entry.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-fs-base font-medium text-ink">{entry.name}</p>
                  {entry.designation && <p className="truncate text-fs-sm text-muted">{entry.designation}</p>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => setStatus(entry.employeeId, "Present")}
                    aria-pressed={current === "Present"}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-lg border",
                      current === "Present" ? "border-success bg-success-bg text-success" : "border-border text-muted hover:bg-surface"
                    )}
                  >
                    <Check className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus(entry.employeeId, "Absent")}
                    aria-pressed={current === "Absent"}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-lg border",
                      current === "Absent" ? "border-danger bg-danger-bg text-danger" : "border-border text-muted hover:bg-surface"
                    )}
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Drawer>
  );
}
