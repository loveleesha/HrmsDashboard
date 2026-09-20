export type LeaveType = "Casual Leave" | "Sick Leave" | "Earned Leave" | "Unpaid Leave";

export type LeaveStatus = "Pending" | "Approved" | "Rejected" | "Cancelled";

export const LEAVE_TYPES: LeaveType[] = ["Casual Leave", "Sick Leave", "Earned Leave", "Unpaid Leave"];

export const LEAVE_TYPE_ANNUAL_QUOTA: Record<LeaveType, number> = {
  "Casual Leave": 12,
  "Sick Leave": 10,
  "Earned Leave": 15,
  "Unpaid Leave": 0,
};

export interface LeaveBalance {
  type: LeaveType;
  /** Annual cap for this type — 0 for Unpaid Leave, which has none. */
  total: number;
  /** Approved days this calendar year. */
  used: number;
  /** Days reserved by still-pending requests this calendar year. */
  pending: number;
  remaining: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  department: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  appliedOn: string;
  approverName?: string;
  approvedOn?: string;
  comment?: string;
}
