import { StatusDot } from "@/components/atoms/StatusDot";
import { STATUS_DOT_TONE, STATUS_LABEL } from "@/lib/attendance-utils";
import type { AttendanceStatus } from "@/types/attendance";

const LEGEND_ITEMS: AttendanceStatus[] = ["present", "late", "leave", "absent", "holiday"];

export function AttendanceLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-fs-base text-muted">
      {LEGEND_ITEMS.map((status) => (
        <span key={status} className="flex items-center gap-1.5">
          <StatusDot tone={STATUS_DOT_TONE[status]} />
          {STATUS_LABEL[status]}
        </span>
      ))}
    </div>
  );
}
