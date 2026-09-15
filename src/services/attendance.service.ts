import type { AttendanceDay, AttendanceMonthSummary } from "@/types/attendance";
import { toDateKey } from "@/lib/attendance-utils";

/**
 * Attendance service. Weekend/holiday classification is real calendar math;
 * everything else (actual punch-in/out records) has no backend yet, so this
 * returns no entry for ordinary working days rather than fabricating one.
 * Replace with real API calls once the Node.js backend exists — callers
 * only depend on these functions' signatures.
 */

export const HOLIDAYS: Record<string, string> = {
  "2026-01-26": "Republic Day",
  "2026-03-06": "Holi",
  "2026-08-15": "Independence Day",
  "2026-09-14": "Ganesh Chaturthi",
  "2026-10-02": "Gandhi Jayanti",
  "2026-10-20": "Diwali",
  "2026-12-25": "Christmas",
};

function formatTime(totalMinutes: number): string {
  const hour = Math.floor(totalMinutes / 60) % 24;
  const minute = totalMinutes % 60;
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${period}`;
}

function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
}

/**
 * `employeeId` is kept in the signature (unused for now) so callers don't
 * need to change once this reads from a real per-employee attendance source.
 */
export function getAttendanceMonth(employeeId: string, year: number, month: number): AttendanceDay[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: AttendanceDay[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateKey = toDateKey(date);
    const dow = date.getDay();
    const isWeekend = dow === 0 || dow === 6;

    if (isWeekend) {
      days.push({ date: dateKey, status: "weekend" });
      continue;
    }

    if (HOLIDAYS[dateKey]) {
      days.push({ date: dateKey, status: "holiday", holidayName: HOLIDAYS[dateKey] });
      continue;
    }

    // No real punch-in/out record source yet — leave ordinary working days
    // unlisted rather than fabricating a status for them.
  }

  return days;
}

export function getAttendanceSummary(days: AttendanceDay[]): AttendanceMonthSummary {
  const workingDays = days.filter((day) => day.status !== "weekend" && day.status !== "holiday");
  const present = days.filter((day) => day.status === "present").length;
  const late = days.filter((day) => day.status === "late").length;
  const absent = days.filter((day) => day.status === "absent").length;
  const leave = days.filter((day) => day.status === "leave").length;

  const workedDays = days.filter((day) => day.workingHours);
  const totalMinutes = workedDays.reduce((sum, day) => {
    const [h, m] = (day.workingHours ?? "0h 0m").match(/\d+/g)?.map(Number) ?? [0, 0];
    return sum + h * 60 + m;
  }, 0);
  const totalOvertimeMinutes = workedDays.reduce((sum, day) => {
    const [h, m] = (day.overtime ?? "0h 0m").match(/\d+/g)?.map(Number) ?? [0, 0];
    return sum + h * 60 + m;
  }, 0);

  const averageMinutes = workedDays.length ? Math.round(totalMinutes / workedDays.length) : 0;
  const attendanceRate = workingDays.length
    ? Math.round(((present + late) / workingDays.length) * 1000) / 10
    : 0;

  return {
    present,
    late,
    absent,
    leave,
    totalWorkingDays: workingDays.length,
    averageWorkingHours: formatDuration(averageMinutes),
    totalOvertime: formatDuration(totalOvertimeMinutes),
    attendanceRate,
  };
}

export function punchOutToday(day: AttendanceDay): AttendanceDay {
  if (day.punchOut || !day.punchIn) return day;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const punchOutLabel = formatTime(nowMinutes);

  const [inH, inM] = day.punchIn.match(/\d+/g)?.map(Number) ?? [9, 0];
  const isPm = day.punchIn.includes("PM") && inH !== 12;
  const punchInMinutes = (isPm ? inH + 12 : inH) * 60 + inM;
  const elapsedMinutes = Math.max(0, nowMinutes - punchInMinutes);

  // Only insert a break if enough time has actually elapsed to fit one before now.
  const canFitBreak = elapsedMinutes >= 90;
  const breakLengthMinutes = canFitBreak ? 60 : 0;
  const breakStartMinutes = canFitBreak
    ? punchInMinutes + Math.floor((elapsedMinutes - breakLengthMinutes) / 2)
    : null;
  const breakEndMinutes = breakStartMinutes !== null ? breakStartMinutes + breakLengthMinutes : null;

  const workedMinutes = Math.max(0, elapsedMinutes - breakLengthMinutes);

  return {
    ...day,
    punchOut: punchOutLabel,
    workingHours: formatDuration(workedMinutes),
    breakDuration: formatDuration(breakLengthMinutes),
    overtime: formatDuration(Math.max(0, workedMinutes - 9 * 60)),
    timeline: [
      ...(day.timeline ?? []),
      ...(breakStartMinutes !== null && breakEndMinutes !== null
        ? [
            { time: formatTime(breakStartMinutes), label: "Break Started" },
            { time: formatTime(breakEndMinutes), label: "Break Ended" },
          ]
        : []),
      { time: punchOutLabel, label: "Punch Out" },
    ],
  };
}
