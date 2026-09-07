export interface DashboardStat {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down" | "flat";
}

export interface MonthlyPoint {
  month: string;
  value: number;
}

export interface AttendanceDayPoint {
  day: string;
  present: number;
  remote: number;
  absent: number;
}

export interface DepartmentSlice {
  department: string;
  count: number;
}

export interface AttendanceEntry {
  name: string;
  designation: string;
  status: "Present" | "Remote" | "On Leave" | "Late";
  checkIn: string;
}

export interface BirthdayEntry {
  name: string;
  designation: string;
  date: string;
}

export interface NewJoineeEntry {
  name: string;
  designation: string;
  department: string;
  joinedOn: string;
}

export type EventType = "Town Hall" | "Workshop" | "Social" | "Training" | "Celebration";

export interface EventEntry {
  title: string;
  date: string;
  time: string;
  location: string;
  type: EventType;
  attendees: number;
}

export interface HolidayEntry {
  name: string;
  date: string;
  day: string;
}

export interface LeaveRequestEntry {
  name: string;
  leaveType: string;
  dates: string;
  days: number;
}

export interface ActivityEntry {
  actor: string;
  action: string;
  timestamp: string;
}

export interface AnnouncementEntry {
  title: string;
  body: string;
  postedBy: string;
  date: string;
  priority: "High" | "Normal";
}

export interface DashboardData {
  stats: DashboardStat[];
  employeeGrowth: MonthlyPoint[];
  attendanceTrend: AttendanceDayPoint[];
  leaveTrend: MonthlyPoint[];
  departmentDistribution: DepartmentSlice[];
  todayAttendance: AttendanceEntry[];
  upcomingBirthdays: BirthdayEntry[];
  newJoinees: NewJoineeEntry[];
  upcomingEvents: EventEntry[];
  upcomingHolidays: HolidayEntry[];
  pendingLeaveRequests: LeaveRequestEntry[];
  recentActivity: ActivityEntry[];
  announcements: AnnouncementEntry[];
}
