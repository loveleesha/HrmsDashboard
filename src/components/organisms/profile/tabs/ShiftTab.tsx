import { Clock, Building2, Home } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const OFFICE_DAYS = new Set(["Mon", "Tue", "Thu"]);

export function ShiftTab() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-surface-card p-5">
        <h3 className="mb-4 text-fs-xl font-semibold text-ink">Current Shift</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <Clock className="size-5" />
            </span>
            <div>
              <p className="text-fs-sm text-muted">Shift Timing</p>
              <p className="text-fs-lg font-semibold text-ink">09:00 AM – 06:00 PM</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-info-bg text-info">
              <Building2 className="size-5" />
            </span>
            <div>
              <p className="text-fs-sm text-muted">Work Mode</p>
              <p className="text-fs-lg font-semibold text-ink">Hybrid (Custom)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-success-bg text-success">
              <Home className="size-5" />
            </span>
            <div>
              <p className="text-fs-sm text-muted">Remote Days</p>
              <p className="text-fs-lg font-semibold text-ink">Wed, Fri, Sat, Sun</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-card p-5">
        <h3 className="mb-3 text-fs-xl font-semibold text-ink">Weekly Office Schedule</h3>
        <div className="grid grid-cols-7 gap-2">
          {WEEK_DAYS.map((day) => {
            const isOffice = OFFICE_DAYS.has(day);
            return (
              <div
                key={day}
                className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-3 text-center"
              >
                <span className="text-fs-base font-medium text-ink">{day}</span>
                <Badge tone={isOffice ? "primary" : "neutral"}>{isOffice ? "Office" : "Remote"}</Badge>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
