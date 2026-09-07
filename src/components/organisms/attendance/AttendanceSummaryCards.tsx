import { Clock, TrendingUp, Timer } from "lucide-react";
import { StatCard } from "@/components/molecules/StatCard";
import type { AttendanceMonthSummary } from "@/types/attendance";
import { cn } from "@/lib/cn";

const MINI_CARDS: {
  key: keyof Pick<AttendanceMonthSummary, "present" | "late" | "absent" | "leave">;
  label: string;
  colorClass: string;
}[] = [
  { key: "present", label: "Present", colorClass: "text-success" },
  { key: "late", label: "Late", colorClass: "text-warning" },
  { key: "absent", label: "Absent", colorClass: "text-danger" },
  { key: "leave", label: "Leave", colorClass: "text-info" },
];

export function AttendanceSummaryCards({ summary }: { summary: AttendanceMonthSummary }) {
  return (
    <div className="mb-4 flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {MINI_CARDS.map((card) => (
          <div
            key={card.key}
            className="flex flex-col items-center gap-1 rounded-xl border border-border bg-surface-card py-4 text-center"
          >
            <span className={cn("text-fs-6xl font-bold", card.colorClass)}>
              {summary[card.key]}
            </span>
            <span className="text-fs-base text-muted">{card.label} Days</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Attendance Rate"
          value={`${summary.attendanceRate}%`}
          icon={TrendingUp}
        />
        <StatCard
          label="Average Working Hours"
          value={summary.averageWorkingHours}
          icon={Clock}
        />
        <StatCard
          label="Total Overtime"
          value={summary.totalOvertime}
          icon={Timer}
        />
      </div>
    </div>
  );
}
