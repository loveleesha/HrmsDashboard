import type { AttendanceDay, AttendanceMonthSummary, AttendanceTimelineEvent } from "@/types/attendance";
import { toDateKey } from "@/lib/attendance-utils";

/**
 * Mock attendance service. Replace the body of getAttendanceMonth /
 * getAttendanceSummary with real API calls once the Node.js backend
 * exists — callers only depend on these functions' signatures.
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

function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (Math.imul(31, hash) + seed.charCodeAt(i)) | 0;
  }
  return ((hash >>> 0) % 10000) / 10000;
}

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

const SHIFT_LABEL = "09:00 AM – 06:00 PM";

function buildWorkingDay(employeeId: string, dateKey: string, isToday: boolean): AttendanceDay {
  const rand = seededRandom(`${employeeId}-${dateKey}`);

  if (rand < 0.05) {
    return { date: dateKey, status: "absent", shift: SHIFT_LABEL };
  }

  if (rand < 0.12) {
    return {
      date: dateKey,
      status: "leave",
      shift: SHIFT_LABEL,
      notes: "Approved leave.",
    };
  }

  const isLate = rand < 0.2;
  const punchInMinutes = isLate
    ? 9 * 60 + 35 + Math.floor(rand * 70)
    : 8 * 60 + 45 + Math.floor(rand * 30);
  const breakStartMinutes = 13 * 60 + Math.floor(rand * 20);
  const breakLengthMinutes = 45 + Math.floor(rand * 30);
  const breakEndMinutes = breakStartMinutes + breakLengthMinutes;

  if (isToday) {
    const timeline: AttendanceTimelineEvent[] = [
      { time: formatTime(punchInMinutes), label: "Punch In" },
    ];
    return {
      date: dateKey,
      status: isLate ? "late" : "present",
      punchIn: formatTime(punchInMinutes),
      shift: SHIFT_LABEL,
      location: rand > 0.7 ? "Remote" : "Office",
      timeline,
    };
  }

  const workedMinutes = 8 * 60 + 30 + Math.floor(rand * 90);
  const punchOutMinutes = punchInMinutes + breakLengthMinutes + workedMinutes;
  const overtimeMinutes = Math.max(0, workedMinutes - 9 * 60);

  const timeline: AttendanceTimelineEvent[] = [
    { time: formatTime(punchInMinutes), label: "Punch In" },
    { time: formatTime(breakStartMinutes), label: "Break Started" },
    { time: formatTime(breakEndMinutes), label: "Break Ended" },
    { time: formatTime(punchOutMinutes), label: "Punch Out" },
  ];

  return {
    date: dateKey,
    status: isLate ? "late" : "present",
    punchIn: formatTime(punchInMinutes),
    punchOut: formatTime(punchOutMinutes),
    workingHours: formatDuration(workedMinutes),
    breakDuration: formatDuration(breakLengthMinutes),
    overtime: formatDuration(overtimeMinutes),
    shift: SHIFT_LABEL,
    location: rand > 0.75 ? "Remote" : "Office",
    timeline,
  };
}

export function getAttendanceMonth(
  employeeId: string,
  year: number,
  month: number,
  today: Date = new Date()
): AttendanceDay[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = toDateKey(today);
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

    if (dateKey > todayKey) {
      continue;
    }

    days.push(buildWorkingDay(employeeId, dateKey, dateKey === todayKey));
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
