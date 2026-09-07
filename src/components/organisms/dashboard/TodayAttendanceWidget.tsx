import { UserCheck } from "lucide-react";
import { WidgetCard } from "@/components/molecules/WidgetCard";
import { Avatar } from "@/components/atoms/Avatar";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import type { AttendanceEntry } from "@/types/dashboard";

export function TodayAttendanceWidget({ entries }: { entries: AttendanceEntry[] }) {
  return (
    <WidgetCard title="Today's Attendance" icon={UserCheck}>
      <ul className="flex flex-col gap-3">
        {entries.map((entry) => (
          <li key={entry.name} className="flex items-center gap-3">
            <Avatar name={entry.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-fs-base font-medium text-ink">{entry.name}</p>
              <p className="truncate text-fs-sm text-muted">{entry.designation}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <StatusBadge status={entry.status} />
              <span className="text-fs-sm text-muted-light">{entry.checkIn}</span>
            </div>
          </li>
        ))}
      </ul>
    </WidgetCard>
  );
}
