"use client";

import { LogIn, LogOut, Clock, Coffee, Timer, MapPin, CalendarClock } from "lucide-react";
import { Drawer } from "@/components/molecules/Drawer";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { STATUS_DOT_TONE, STATUS_LABEL, formatFullDate } from "@/lib/attendance-utils";
import { StatusDot } from "@/components/atoms/StatusDot";
import type { AttendanceDay } from "@/types/attendance";

export interface AttendanceDetailsPanelProps {
  dateKey: string | null;
  day: AttendanceDay | null;
  isToday: boolean;
  onClose: () => void;
  onClockOut: () => void;
}

export function AttendanceDetailsPanel({
  dateKey,
  day,
  isToday,
  onClose,
  onClockOut,
}: AttendanceDetailsPanelProps) {
  return (
    <Drawer
      open={Boolean(dateKey)}
      onClose={onClose}
      title={dateKey ? formatFullDate(dateKey) : undefined}
    >
      {day && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <StatusDot tone={STATUS_DOT_TONE[day.status]} />
            <Badge tone={STATUS_DOT_TONE[day.status]}>{STATUS_LABEL[day.status]}</Badge>
            {day.holidayName && <span className="text-fs-base text-muted">{day.holidayName}</span>}
          </div>

          {isToday && day.status !== "weekend" && day.status !== "holiday" && (
            <div className="rounded-lg border border-primary-border bg-primary-softer p-4">
              <p className="mb-2 text-fs-base font-semibold text-ink">Today&apos;s Attendance</p>
              {day.punchIn && (
                <div className="mb-1 flex items-center gap-2 text-fs-base text-ink">
                  <LogIn className="size-4 text-primary" />
                  {day.punchIn} — Punch In
                </div>
              )}
              {day.punchOut ? (
                <div className="mb-1 flex items-center gap-2 text-fs-base text-ink">
                  <LogOut className="size-4 text-primary" />
                  {day.punchOut} — Punch Out
                </div>
              ) : day.punchIn ? (
                <>
                  <p className="mb-3 text-fs-base font-medium text-primary">Currently Working</p>
                  <Button size="sm" onClick={onClockOut} className="w-full">
                    Clock Out
                  </Button>
                </>
              ) : (
                <p className="text-fs-base text-muted">No punch-in recorded for today.</p>
              )}
            </div>
          )}

          {(day.punchIn || day.status === "absent" || day.status === "leave") && (
            <div className="grid grid-cols-2 gap-3">
              <DetailStat icon={LogIn} label="Punch In" value={day.punchIn ?? "--"} />
              <DetailStat icon={LogOut} label="Punch Out" value={day.punchOut ?? "--"} />
              <DetailStat icon={Clock} label="Working Hours" value={day.workingHours ?? "--"} />
              <DetailStat icon={Coffee} label="Break" value={day.breakDuration ?? "--"} />
              <DetailStat icon={Timer} label="Overtime" value={day.overtime ?? "--"} />
              <DetailStat icon={MapPin} label="Location" value={day.location ?? "--"} />
            </div>
          )}

          {day.shift && (
            <div className="flex items-center gap-2 text-fs-base text-muted">
              <CalendarClock className="size-4" />
              Shift: {day.shift}
            </div>
          )}

          {day.notes && (
            <div className="rounded-lg bg-surface p-3 text-fs-base text-muted">{day.notes}</div>
          )}

          {day.timeline && day.timeline.length > 0 && (
            <div>
              <p className="mb-3 text-fs-base font-semibold text-ink">Timeline</p>
              <ol className="flex flex-col gap-4">
                {day.timeline.map((event, index) => (
                  <li key={`${event.time}-${event.label}`} className="relative flex gap-3 pl-1">
                    <span className="flex flex-col items-center">
                      <span className="mt-1 size-2.5 shrink-0 rounded-full bg-primary" />
                      {index < day.timeline!.length - 1 && (
                        <span className="mt-1 w-px flex-1 bg-border" />
                      )}
                    </span>
                    <span className="-mt-0.5">
                      <span className="block text-fs-base font-medium text-ink">{event.time}</span>
                      <span className="block text-fs-sm text-muted">{event.label}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}

function DetailStat({
  icon: IconComponent,
  label,
  value,
}: {
  icon: typeof LogIn;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-1 flex items-center gap-1.5 text-fs-sm text-muted">
        <IconComponent className="size-3.5" />
        {label}
      </div>
      <p className="text-fs-lg font-semibold text-ink">{value}</p>
    </div>
  );
}
