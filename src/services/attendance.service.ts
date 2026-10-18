import { httpService } from "@/lib/http/http.service";
import { API_ENDPOINTS } from "@/lib/apiEndpoint";
import type { AttendanceDay, AttendanceImportSummary, AttendanceMonthSummary } from "@/types/attendance";
import { toDateKey } from "@/lib/attendance-utils";

/**
 * Attendance service — wired to the real backend (routes/User/attendanceRoutes.js
 * for the caller's own records, routes/Admin/attendanceRoutes.js for viewing
 * someone else's, same split as every other self-service/admin-wide pair this
 * app already has). Weekend/holiday classification stays real calendar math
 * layered underneath (the backend has no holiday calendar of its own yet) —
 * an actual attendance record for that date always wins over the generic
 * weekend/holiday guess, since someone can genuinely have worked one.
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

interface RawAttendanceRecord {
  id?: string;
  date?: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  workedHours?: number | null;
  status?: string;
}

// "Late" (check-in after the shift-start grace period) and "Half-Day" (short
// total hours, regardless of arrival time) are distinct backend statuses —
// see utils/attendanceHelpers.js's determineAttendanceStatus — and now map to
// their own distinct UI statuses too (previously Half-Day shared "late"'s
// bucket, which mislabeled an on-time-but-short day as "Late").
const BACKEND_STATUS_MAP: Record<string, AttendanceDay["status"]> = {
  Present: "present",
  Late: "late",
  "Half-Day": "half-day",
  Absent: "absent",
  "On-Leave": "leave",
  Holiday: "holiday",
};

// UTC getters, not local ones: the backend's attendance import (controllers/
// Admin/attendanceController.js's importAttendance) has no real timezone to
// work with — a device export's raw "16:24" punch has no offset attached at
// all — so it stores that literal clock reading as this Date's UTC digits
// (Date.UTC(year, month, day, hours, minutes)), by convention, rather than
// as a true timezone-aware instant. Reading it back with local getters would
// re-interpret those same digits in the *viewer's* browser timezone instead
// (e.g. shifting "16:24" to "21:54" for an IST viewer) — reading UTC getters
// here is what actually reproduces the file's own numbers on screen.
function formatClockTime(iso: string): string {
  const date = new Date(iso);
  return formatTime(date.getUTCHours() * 60 + date.getUTCMinutes());
}

function formatHoursDuration(hours: number): string {
  return formatDuration(Math.round(hours * 60));
}

function mapRecordToDay(record: RawAttendanceRecord, dateKey: string): AttendanceDay {
  const punchIn = record.checkInTime ? formatClockTime(record.checkInTime) : undefined;
  const punchOut = record.checkOutTime ? formatClockTime(record.checkOutTime) : undefined;
  const workingHours = record.workedHours != null ? formatHoursDuration(record.workedHours) : undefined;
  const overtime = record.workedHours != null ? formatHoursDuration(Math.max(0, record.workedHours - 9)) : undefined;

  return {
    date: dateKey,
    status: (record.status && BACKEND_STATUS_MAP[record.status]) || "absent",
    punchIn,
    punchOut,
    workingHours,
    overtime,
  };
}

/** Every day of the month: a real attendance record where one exists
 * (imported or punched in/out), else weekend/holiday calendar math, else
 * left out entirely — an ordinary working day nobody's recorded anything
 * for yet shows as blank rather than a fabricated Absent. */
function buildMonthDays(year: number, month: number, records: RawAttendanceRecord[]): AttendanceDay[] {
  const byDateKey = new Map(records.filter((r) => r.date).map((r) => [toDateKey(new Date(r.date!)), r]));
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: AttendanceDay[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateKey = toDateKey(date);

    const record = byDateKey.get(dateKey);
    if (record) {
      days.push(mapRecordToDay(record, dateKey));
      continue;
    }

    const dow = date.getDay();
    if (dow === 0 || dow === 6) {
      days.push({ date: dateKey, status: "weekend" });
      continue;
    }

    if (HOLIDAYS[dateKey]) {
      days.push({ date: dateKey, status: "holiday", holidayName: HOLIDAYS[dateKey] });
      continue;
    }
  }

  return days;
}

function monthQueryKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

/** The caller's own attendance for one month — GET /api/user/attendance,
 * gated on attendance.view (every role by default). */
export async function getMyAttendanceMonth(year: number, month: number): Promise<AttendanceDay[]> {
  const data = await httpService.get<{ attendance: RawAttendanceRecord[] }>(API_ENDPOINTS.user.attendance, {
    month: monthQueryKey(year, month),
  });
  return buildMonthDays(year, month, data.attendance);
}

/** The caller's own attendance record for today, or null if nothing's been
 * recorded yet — GET /api/user/attendance/today, gated on attendance.view. */
export async function getMyAttendanceToday(): Promise<AttendanceDay | null> {
  const data = await httpService.get<{ attendance: RawAttendanceRecord | null }>(API_ENDPOINTS.user.attendanceToday);
  return data.attendance ? mapRecordToDay(data.attendance, toDateKey(new Date())) : null;
}

/** Someone else's attendance for one month — GET /api/admin/attendance,
 * gated on attendance.approve (team-oversight tier, NOT the attendance.view
 * every role gets for its own records — see controllers/Admin/
 * attendanceController.js's own note on this). `employeeRecordId` is the
 * Employee document's own _id (Employee.employeeRecordId on the frontend
 * type), not the account's userId. */
export async function getTeamAttendanceMonth(employeeRecordId: string, year: number, month: number): Promise<AttendanceDay[]> {
  const data = await httpService.get<{ attendance: RawAttendanceRecord[] }>(API_ENDPOINTS.admin.attendance, {
    employeeId: employeeRecordId,
    month: monthQueryKey(year, month),
  });
  return buildMonthDays(year, month, data.attendance);
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

/**
 * Admin > Attendance > Attendance Upload — wired to the real backend
 * (routes/Admin/attendanceRoutes.js's POST /import), unlike the rest of this
 * file. Accepts a CSV/XLS/XLSX export (a biometric device's own "Attendance
 * Record" format — see the backend's utils/parseAttendanceImport.js for the
 * exact expected layout) covering at most one month; the backend rejects a
 * longer range with a 400.
 */
export async function importAttendance(file: File): Promise<AttendanceImportSummary> {
  const formData = new FormData();
  formData.append("file", file);
  const data = await httpService.post<{ summary: AttendanceImportSummary }>(API_ENDPOINTS.admin.attendanceImport, formData);
  return data.summary;
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
