import { httpService } from "@/lib/http/http.service";
import { API_ENDPOINTS } from "@/lib/apiEndpoint";
import { LEAVE_TYPE_ANNUAL_QUOTA, type LeaveBalance, type LeaveRequest, type LeaveStatus, type LeaveType } from "@/types/leave";

/**
 * Leave — wired to the real HRMS backend's User > Leave / Admin > Leave
 * (Team Approvals) API (see the "HRMS API" Postman collection). leave.view is
 * self-service (own requests only); leave.approve is deliberately separate
 * and admin-tier only, for the Team Approvals surface below — a regular
 * employee's own leave.view can't list everyone's requests. There's no
 * self-cancel endpoint in the collection, so a submitted request can't be
 * withdrawn from this app once applied.
 */

interface RawEmployeeRef {
  id?: string;
  _id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  /** The human-readable code (e.g. "EMP-0005"), not a Mongo id, despite the name. */
  employeeId?: string;
  designation?: string;
  department?: string;
}

interface RawLeaveRequest {
  id?: string;
  _id?: string;
  employee?: RawEmployeeRef | string | null;
  type?: string;
  leaveType?: string;
  startDate?: string;
  endDate?: string;
  days?: number;
  reason?: string;
  status?: string;
  createdAt?: string;
  appliedOn?: string;
  approverName?: string;
  approvedBy?: RawEmployeeRef | string | null;
  /** The real backend returns this as a plain user-id string, not a
   * populated ref — so there's no name to show, just a review date. */
  reviewedBy?: string;
  approvedOn?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

interface RawLeaveBalance {
  type?: string;
  cap?: number | null;
  used?: number;
  pending?: number;
  remaining?: number | null;
}

function normalizeStatus(value: string | undefined): LeaveRequest["status"] {
  const lower = value?.toLowerCase();
  if (lower === "approved") return "Approved";
  if (lower === "rejected") return "Rejected";
  if (lower === "cancelled") return "Cancelled";
  return "Pending";
}

function refName(ref: RawEmployeeRef | undefined): string | undefined {
  if (!ref) return undefined;
  return ref.name ?? ([ref.firstName, ref.lastName].filter(Boolean).join(" ").trim() || undefined);
}

function mapLeaveRequest(raw: RawLeaveRequest): LeaveRequest {
  const employee = typeof raw.employee === "object" && raw.employee ? raw.employee : undefined;
  const approver = typeof raw.approvedBy === "object" && raw.approvedBy ? raw.approvedBy : undefined;
  const startDate = raw.startDate ?? "";
  const endDate = raw.endDate ?? startDate;

  return {
    id: raw.id ?? raw._id ?? "",
    employeeId: employee?._id ?? employee?.id ?? "",
    employeeName: refName(employee) ?? "—",
    designation: employee?.designation ?? "",
    department: employee?.department ?? "",
    leaveType: (raw.type ?? raw.leaveType ?? "Casual Leave") as LeaveType,
    startDate,
    endDate,
    days: raw.days ?? calculateLeaveDays(startDate, endDate),
    reason: raw.reason ?? "",
    status: normalizeStatus(raw.status),
    appliedOn: raw.createdAt ?? raw.appliedOn ?? "",
    approverName: raw.approverName ?? refName(approver),
    approvedOn: raw.approvedOn ?? raw.reviewedAt,
    comment: raw.rejectionReason,
  };
}

function mapBalance(raw: RawLeaveBalance): LeaveBalance {
  const type = (raw.type ?? "Casual Leave") as LeaveType;
  const total = raw.cap ?? LEAVE_TYPE_ANNUAL_QUOTA[type] ?? 0;
  const used = raw.used ?? 0;
  const pending = raw.pending ?? 0;
  return {
    type,
    total,
    used,
    pending,
    remaining: raw.remaining ?? Math.max(0, total - used - pending),
  };
}

function unwrapRequests(
  data: { leave?: RawLeaveRequest[]; leaves?: RawLeaveRequest[]; requests?: RawLeaveRequest[] } | RawLeaveRequest[]
): RawLeaveRequest[] {
  // The real backend's own key is "leave" (singular) — "leaves"/"requests"
  // are kept as defensive fallbacks in case that ever changes.
  return Array.isArray(data) ? data : (data.leave ?? data.leaves ?? data.requests ?? []);
}

function unwrapBalances(
  data: { balance?: RawLeaveBalance[]; balances?: RawLeaveBalance[] } | RawLeaveBalance[]
): RawLeaveBalance[] {
  return Array.isArray(data) ? data : (data.balance ?? data.balances ?? []);
}

function byAppliedDesc(a: LeaveRequest, b: LeaveRequest) {
  return new Date(b.appliedOn).getTime() - new Date(a.appliedOn).getTime();
}

/* ---------------------------- User > Leave ------------------------------ */

export async function getMyLeaveBalance(): Promise<LeaveBalance[]> {
  const data = await httpService.get<Parameters<typeof unwrapBalances>[0]>(API_ENDPOINTS.user.leaveBalance);
  return unwrapBalances(data).map(mapBalance);
}

export async function getMyLeaveRequests(status?: LeaveStatus): Promise<LeaveRequest[]> {
  const data = await httpService.get<Parameters<typeof unwrapRequests>[0]>(
    API_ENDPOINTS.user.leave,
    status ? { status: status.toLowerCase() } : undefined
  );
  return unwrapRequests(data).map(mapLeaveRequest).sort(byAppliedDesc);
}

/** Always created "pending" — no cap check here; that's enforced only when
 * Team Approvals approves it (400 LEAVE_BALANCE_EXCEEDED if it would push
 * approved days for that type/year over the annual cap). */
export async function applyForLeave(payload: { type: LeaveType; startDate: string; endDate: string; reason: string }): Promise<void> {
  await httpService.post(API_ENDPOINTS.user.leave, payload);
}

/* ---------------------- Admin > Leave (Team Approvals) ------------------ */

export async function listTeamLeave(filters: { status?: LeaveStatus; employeeId?: string } = {}): Promise<LeaveRequest[]> {
  const query: Record<string, string> = {};
  if (filters.status) query.status = filters.status.toLowerCase();
  if (filters.employeeId) query.employeeId = filters.employeeId;
  const data = await httpService.get<Parameters<typeof unwrapRequests>[0]>(API_ENDPOINTS.admin.leave, query);
  return unwrapRequests(data).map(mapLeaveRequest).sort(byAppliedDesc);
}

export async function approveLeave(id: string): Promise<void> {
  await httpService.patch(API_ENDPOINTS.admin.leaveStatus(id), { status: "approved" });
}

export async function rejectLeave(id: string, rejectionReason: string): Promise<void> {
  await httpService.patch(API_ENDPOINTS.admin.leaveStatus(id), { status: "rejected", rejectionReason });
}

/* ------------------------------ Utilities -------------------------------- */

export function calculateLeaveDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;

  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

/** Pure client-side filter over an already-fetched request list — approved
 * requests whose range hasn't ended yet, soonest first. Used against
 * listTeamLeave's results for approvers (there's no dedicated "upcoming team
 * leave" endpoint), so this widget is simply hidden for non-approvers. */
export function getUpcomingTeamLeave(requests: LeaveRequest[], today: Date): LeaveRequest[] {
  const todayTime = today.setHours(0, 0, 0, 0);
  return requests
    .filter((request) => request.status === "Approved" && new Date(request.endDate).getTime() >= todayTime)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 6);
}
