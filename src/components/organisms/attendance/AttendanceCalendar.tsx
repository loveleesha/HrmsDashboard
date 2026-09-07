"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { getCalendarWeeks, formatMonthLabel, toDateKey } from "@/lib/attendance-utils";
import { STATUS_CELL_CLASS } from "@/lib/attendance-utils";
import type { AttendanceDay } from "@/types/attendance";
import { cn } from "@/lib/cn";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export interface AttendanceCalendarProps {
  year: number;
  month: number;
  days: AttendanceDay[];
  selectedDateKey: string | null;
  onSelectDate: (dateKey: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

export function AttendanceCalendar({
  year,
  month,
  days,
  selectedDateKey,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onToday,
}: AttendanceCalendarProps) {
  const dayMap = new Map(days.map((day) => [day.date, day]));
  const weeks = getCalendarWeeks(year, month);
  const todayKey = toDateKey(new Date());

  return (
    <div className="rounded-xl border border-border bg-surface-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-fs-2xl font-semibold text-ink">{formatMonthLabel(year, month)}</h3>
        <div className="flex items-center gap-1.5">
          <Button variant="secondary" size="sm" onClick={onToday}>
            Today
          </Button>
          <Button variant="secondary" size="sm" onClick={onPrevMonth} aria-label="Previous month">
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={onNextMonth} aria-label="Next month">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1 text-center text-fs-sm font-medium text-muted-light">
            {label}
          </div>
        ))}

        {weeks.flat().map((cell) => {
          const record = dayMap.get(cell.dateKey);
          const isToday = cell.dateKey === todayKey;
          const isSelected = cell.dateKey === selectedDateKey;
          const isClickable = cell.inCurrentMonth && Boolean(record);

          return (
            <button
              key={cell.dateKey}
              type="button"
              disabled={!isClickable}
              data-date={cell.dateKey}
              data-today={isToday || undefined}
              aria-label={`${cell.date.toLocaleDateString("en-IN", { day: "numeric", month: "long" })}${record ? `, ${record.status}` : ""}`}
              onClick={() => isClickable && onSelectDate(cell.dateKey)}
              className={cn(
                "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg text-fs-base transition-colors sm:gap-1",
                !cell.inCurrentMonth && "opacity-30",
                isClickable ? "cursor-pointer hover:ring-2 hover:ring-primary/30" : "cursor-default",
                record ? STATUS_CELL_CLASS[record.status] : "text-muted-light",
                isSelected && "ring-2 ring-primary",
                isToday && !isSelected && "ring-1 ring-primary/50"
              )}
            >
              <span className="font-medium">{cell.date.getDate()}</span>
              {record && record.status !== "weekend" && (
                <span className="hidden text-fs-2xs uppercase tracking-wide sm:block">
                  {record.status === "present" && "P"}
                  {record.status === "late" && "L"}
                  {record.status === "absent" && "A"}
                  {record.status === "leave" && "LV"}
                  {record.status === "holiday" && "H"}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
