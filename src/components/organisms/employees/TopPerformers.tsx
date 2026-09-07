import { Trophy } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import type { Employee } from "@/types/employee";

const MEDALS = ["🥇", "🥈", "🥉"];

export function TopPerformers({ employees }: { employees: Employee[] }) {
  const top3 = [...employees]
    .sort((a, b) => b.performanceScore - a.performanceScore)
    .slice(0, 3);

  if (top3.length === 0) return null;

  return (
    <div className="mb-5 rounded-xl border border-border bg-surface-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Trophy className="size-4 text-primary" />
        <h3 className="text-fs-lg font-semibold text-ink">Top Performers</h3>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
        {top3.map((employee, index) => (
          <div
            key={employee.id}
            className="flex flex-1 items-center gap-2.5 rounded-lg bg-surface px-3 py-2"
          >
            <span className="text-fs-xl" aria-hidden="true">
              {MEDALS[index]}
            </span>
            <Avatar name={employee.name} imageUrl={employee.avatarUrl} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-fs-base font-medium text-ink">{employee.name}</p>
              <p className="truncate text-fs-sm text-muted">{employee.designation}</p>
            </div>
            <span className="text-fs-base font-semibold text-primary">
              {employee.performanceScore}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
