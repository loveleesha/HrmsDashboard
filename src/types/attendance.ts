export type AttendanceStatus =
  | "present"
  | "late"
  | "absent"
  | "leave"
  | "holiday"
  | "weekend";

export interface AttendanceTimelineEvent {
  time: string;
  label: string;
}

export interface AttendanceDay {
  date: string;
  status: AttendanceStatus;
  punchIn?: string;
  punchOut?: string;
  workingHours?: string;
  breakDuration?: string;
  overtime?: string;
  location?: "Office" | "Remote";
  shift?: string;
  notes?: string;
  timeline?: AttendanceTimelineEvent[];
  holidayName?: string;
}

export interface AttendanceMonthSummary {
  present: number;
  late: number;
  absent: number;
  leave: number;
  totalWorkingDays: number;
  averageWorkingHours: string;
  totalOvertime: string;
  attendanceRate: number;
}
