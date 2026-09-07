import { CalendarRange } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import type { LeaveRequest } from "@/types/leave";

export function UpcomingTeamLeave({ requests }: { requests: LeaveRequest[] }) {
  return (
    <div className="rounded-xl border border-border bg-surface-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <CalendarRange className="size-4 text-primary" />
        <h3 className="text-fs-lg font-semibold text-ink">Upcoming Team Leave</h3>
      </div>

      {requests.length === 0 ? (
        <p className="text-fs-base text-muted">No approved leave coming up.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((request) => (
            <div key={request.id} className="flex items-center gap-2.5">
              <Avatar name={request.employeeName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-fs-base font-medium text-ink">{request.employeeName}</p>
                <p className="truncate text-fs-sm text-muted">{request.leaveType}</p>
              </div>
              <span className="shrink-0 text-fs-sm text-muted-light">
                {new Date(request.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
