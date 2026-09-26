"use client";

import { useState } from "react";
import { Check, X, CalendarCheck2, Pencil, Trash2 } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Button } from "@/components/atoms/Button";
import { Textarea } from "@/components/atoms/Textarea";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import type { LeaveRequest } from "@/types/leave";

function formatDateRange(start: string, end: string) {
  const startLabel = new Date(start).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  if (start === end) return startLabel;
  const endLabel = new Date(end).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  return `${startLabel} – ${endLabel}`;
}

export interface LeaveApprovalsListProps {
  requests: LeaveRequest[];
  canApprove: boolean;
  canReject: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string, comment: string) => void;
  /** Distinct from approve/reject — leave.edit/leave.delete, admin-wide
   * correction/removal of any employee's request. */
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (request: LeaveRequest) => void;
  onDelete?: (request: LeaveRequest) => void;
}

export function LeaveApprovalsList({
  requests,
  canApprove,
  canReject,
  onApprove,
  onReject,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: LeaveApprovalsListProps) {
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface-card px-6 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-success-bg text-success">
          <CalendarCheck2 className="size-7" />
        </span>
        <h3 className="text-fs-2xl font-semibold text-ink">All caught up</h3>
        <p className="max-w-sm text-fs-base text-muted">There are no pending leave requests waiting on your approval.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {requests.map((request) => {
        const isRejecting = rejectingId === request.id;

        return (
          <div key={request.id} className="rounded-xl border border-border bg-surface-card p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">
                <Avatar name={request.employeeName} size="md" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-fs-lg font-semibold text-ink">{request.employeeName}</span>
                    <StatusBadge status={request.status} />
                  </div>
                  <p className="text-fs-sm text-muted">
                    {request.designation} · {request.department}
                  </p>
                  <p className="mt-1 text-fs-base text-ink">
                    {request.leaveType} · {formatDateRange(request.startDate, request.endDate)} ·{" "}
                    {request.days} {request.days === 1 ? "day" : "days"}
                  </p>
                  <p className="mt-1 text-fs-base text-muted">&ldquo;{request.reason}&rdquo;</p>
                </div>
              </div>

              {(canApprove || canReject || canEdit || canDelete) && (
                <div className="flex shrink-0 gap-2">
                  {canApprove && (
                    <Button size="sm" onClick={() => onApprove(request.id)}>
                      <Check className="size-3.5" />
                      Approve
                    </Button>
                  )}
                  {canReject && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setRejectingId(isRejecting ? null : request.id);
                        setComment("");
                      }}
                    >
                      <X className="size-3.5" />
                      Reject
                    </Button>
                  )}
                  {canEdit && (
                    <Button variant="ghost" size="sm" onClick={() => onEdit?.(request)}>
                      <Pencil className="size-3.5" />
                      Edit
                    </Button>
                  )}
                  {canDelete && (
                    <Button variant="ghost" size="sm" onClick={() => onDelete?.(request)}>
                      <Trash2 className="size-3.5" />
                      Delete
                    </Button>
                  )}
                </div>
              )}
            </div>

            {isRejecting && (
              <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
                <Textarea
                  rows={2}
                  placeholder="Add a reason for rejecting (visible to the employee)…"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setRejectingId(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={!comment.trim()}
                    onClick={() => {
                      onReject(request.id, comment.trim());
                      setRejectingId(null);
                    }}
                  >
                    Confirm Rejection
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
