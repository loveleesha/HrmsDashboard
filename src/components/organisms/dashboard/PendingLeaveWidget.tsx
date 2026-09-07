import { ClipboardList } from "lucide-react";
import { WidgetCard } from "@/components/molecules/WidgetCard";
import { Button } from "@/components/atoms/Button";
import type { LeaveRequestEntry } from "@/types/dashboard";

export function PendingLeaveWidget({ entries }: { entries: LeaveRequestEntry[] }) {
  return (
    <WidgetCard title="Pending Leave Requests" icon={ClipboardList}>
      <ul className="flex flex-col gap-3">
        {entries.map((entry) => (
          <li key={`${entry.name}-${entry.dates}`} className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-fs-base font-medium text-ink">{entry.name}</p>
              <p className="truncate text-fs-sm text-muted">
                {entry.leaveType} • {entry.dates} • {entry.days}d
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button size="sm" variant="secondary">
                Reject
              </Button>
              <Button size="sm">Approve</Button>
            </div>
          </li>
        ))}
      </ul>
    </WidgetCard>
  );
}
