export type TrainingStatus = "Active" | "Completed" | "Cancelled";
export type TrainingMode = "Online" | "Offline" | "Hybrid";
export type AttendanceStatus = "Present" | "Absent";

export interface TrainingProgram {
  id: string;
  topic: string;
  /** A role name from the live Settings -> Role & Access list — not
   * constrained to this app's built-in Role union, since any role defined
   * there can be targeted. Also who's eligible for attendance: every
   * employee whose account role matches this. */
  targetRole: string;
  trainer: string;
  mode: TrainingMode;
  date: string;
  status: TrainingStatus;
  /** Required when status is "Cancelled"; cleared when moved off it. */
  cancellationReason?: string;
  /** Count of User accounts whose role matches targetRole — only present on
   * Admin > Training > List All Trainings, not the self-service list. */
  enrolled?: number;
}

export interface TrainingAttendanceEntry {
  employeeId: string;
  name: string;
  designation?: string;
  status: AttendanceStatus | null;
}
