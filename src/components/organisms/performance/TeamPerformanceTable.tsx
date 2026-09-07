import { Table } from "@/components/molecules/Table";
import { RatingStars } from "@/components/molecules/RatingStars";
import { Meter } from "@/components/molecules/Meter";
import type { TeamPerformanceRow } from "@/types/performance";

export function TeamPerformanceTable({ rows }: { rows: TeamPerformanceRow[] }) {
  return (
    <Table
      columns={[
        {
          key: "name",
          header: "Employee",
          render: (r: TeamPerformanceRow) => (
            <div>
              <p className="font-medium text-ink">{r.employeeName}</p>
              <p className="text-fs-sm text-muted">{r.designation}</p>
            </div>
          ),
        },
        {
          key: "rating",
          header: "Current Rating",
          render: (r: TeamPerformanceRow) => (
            <div className="flex items-center gap-2">
              <RatingStars rating={r.currentRating} />
              <span className="text-fs-sm text-muted">{r.ratingLabel}</span>
            </div>
          ),
        },
        {
          key: "goals",
          header: "Goals Completed",
          render: (r: TeamPerformanceRow) => (
            <div className="w-32">
              <Meter value={(r.goalsCompleted / r.goalsTotal) * 100} />
              <p className="mt-1 text-fs-sm text-muted">
                {r.goalsCompleted} / {r.goalsTotal}
              </p>
            </div>
          ),
        },
        {
          key: "lastReview",
          header: "Last Review",
          render: (r: TeamPerformanceRow) =>
            new Date(r.lastReviewDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        },
      ]}
      data={rows}
      keyField={(r) => r.employeeId}
      emptyMessage="No team performance data yet."
    />
  );
}
