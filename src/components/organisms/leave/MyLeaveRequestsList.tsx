import { CalendarX2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import type { LeaveRequest } from "@/types/leave";

function formatDateRange(start: string, end: string) {
  const startLabel = new Date(start).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  if (start === end) return startLabel;
  const endLabel = new Date(end).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  return `${startLabel} – ${endLabel}`;
}

export interface MyLeaveRequestsListProps {
  requests: LeaveRequest[];
  /** Edit/delete only ever apply to a still-pending request — the backend
   * itself refuses to touch one that's already been decided. */
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (request: LeaveRequest) => void;
  onDelete?: (request: LeaveRequest) => void;
}

export function MyLeaveRequestsList({ requests, canEdit, canDelete, onEdit, onDelete }: MyLeaveRequestsListProps) {
  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface-card px-6 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary">
          <CalendarX2 className="size-7" />
        </span>
        <h3 className="text-fs-2xl font-semibold text-ink">No leave requests yet</h3>
        <p className="max-w-sm text-fs-base text-muted">
          Apply for leave using the button above and it will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {requests.map((request) => {
        const isPending = request.status === "Pending";
        const showEdit = canEdit && isPending;
        const showDelete = canDelete && isPending;

        return (
          <div key={request.id} className="flex flex-col gap-3 rounded-xl border border-border bg-surface-card p-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="text-fs-lg font-semibold text-ink">{request.leaveType}</span>
                <StatusBadge status={request.status} />
              </div>
              <p className="text-fs-base text-muted">
                {formatDateRange(request.startDate, request.endDate)} · {request.days}{" "}
                {request.days === 1 ? "day" : "days"}
              </p>
              <p className="mt-1 text-fs-base text-ink">{request.reason}</p>
              {request.status === "Rejected" && request.comment && (
                <p className="mt-1 rounded-md bg-danger-bg px-2.5 py-1.5 text-fs-sm text-danger">
                  {request.comment}
                </p>
              )}
              {request.status === "Approved" && request.approverName && (
                <p className="mt-1 text-fs-sm text-muted-light">Approved by {request.approverName}</p>
              )}
            </div>

            {(showEdit || showDelete) && (
              <div className="flex shrink-0 gap-2">
                {showEdit && (
                  <Button variant="ghost" size="sm" onClick={() => onEdit?.(request)}>
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                )}
                {showDelete && (
                  <Button variant="ghost" size="sm" onClick={() => onDelete?.(request)}>
                    <Trash2 className="size-3.5" />
                    Withdraw
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
