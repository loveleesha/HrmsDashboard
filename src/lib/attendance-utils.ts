import type { AttendanceStatus } from "@/types/attendance";

export const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: "Present",
  late: "Late",
  absent: "Absent",
  leave: "Leave",
  holiday: "Holiday",
  weekend: "Weekend",
};

export const STATUS_DOT_TONE: Record<AttendanceStatus, "success" | "warning" | "danger" | "info" | "neutral"> = {
  present: "success",
  late: "warning",
  absent: "danger",
  leave: "info",
  holiday: "neutral",
  weekend: "neutral",
};

export const STATUS_CELL_CLASS: Record<AttendanceStatus, string> = {
  present: "bg-success-bg text-success",
  late: "bg-warning-bg text-warning",
  absent: "bg-danger-bg text-danger",
  leave: "bg-info-bg text-info",
  holiday: "bg-surface text-muted",
  weekend: "bg-transparent text-muted-light",
};

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export interface CalendarCell {
  date: Date;
  dateKey: string;
  inCurrentMonth: boolean;
}

export function getCalendarWeeks(year: number, month: number): CalendarCell[][] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday-first grid
  const gridStart = new Date(year, month, 1 - startOffset);

  const weeks: CalendarCell[][] = [];
  const cursor = new Date(gridStart);

  for (let week = 0; week < 6; week++) {
    const days: CalendarCell[] = [];
    for (let day = 0; day < 7; day++) {
      days.push({
        date: new Date(cursor),
        dateKey: toDateKey(cursor),
        inCurrentMonth: cursor.getMonth() === month,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(days);
    if (cursor.getMonth() !== month && week >= 4) break;
  }

  return weeks;
}

export function formatMonthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

export function formatFullDate(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function isSameDate(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b);
}
