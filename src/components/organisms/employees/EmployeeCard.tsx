import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Meter } from "@/components/molecules/Meter";
import { EmployeeMeta } from "@/components/molecules/EmployeeMeta";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { getPerformanceLabel, PERFORMANCE_BAR_COLOR, PERFORMANCE_TEXT_COLOR } from "@/lib/performance";
import type { Employee } from "@/types/employee";
import { cn } from "@/lib/cn";

export interface EmployeeCardProps {
  employee: Employee;
  rank?: number;
  onViewProfile: (employee: Employee) => void;
}

const RANK_MEDAL: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

export function EmployeeCard({ employee, rank, onViewProfile }: EmployeeCardProps) {
  const label = getPerformanceLabel(employee.performanceScore);

  return (
    <div className="relative flex flex-col items-center gap-3 rounded-xl border border-border bg-surface-card p-5 text-center transition-shadow hover:shadow-md">
      {rank && rank <= 3 && (
        <span
          className="absolute left-3 top-3 text-fs-xl"
          title={`Rank #${rank}`}
          aria-label={`Rank ${rank}`}
        >
          {RANK_MEDAL[rank]}
        </span>
      )}
      <span className="absolute right-3 top-3">
        <StatusBadge status={employee.status} />
      </span>

      <Avatar name={employee.name} imageUrl={employee.avatarUrl} size="lg" className="mt-2" />

      <div>
        <p className="text-fs-xl font-semibold text-ink">{employee.name}</p>
        <p className="text-fs-base text-muted">{employee.designation}</p>
      </div>

      <EmployeeMeta department={employee.department} city={employee.city} />

      <div className="flex flex-wrap justify-center gap-1.5">
        {employee.skills.slice(0, 3).map((skill) => (
          <Badge key={skill} tone="neutral">
            {skill}
          </Badge>
        ))}
      </div>

      <div className="mt-1 w-full border-t border-border pt-3">
        <div className="mb-1.5 flex items-center justify-between text-fs-base">
          <span className="font-medium text-ink">Ranking</span>
          <span className={cn("font-semibold", PERFORMANCE_TEXT_COLOR[label])}>
            {label}
          </span>
        </div>
        <Meter value={employee.performanceScore} colorClassName={PERFORMANCE_BAR_COLOR[label]} />
        <p className="mt-1 text-right text-fs-sm text-muted">{employee.performanceScore}%</p>
      </div>

      <Button variant="secondary" size="sm" className="w-full" onClick={() => onViewProfile(employee)}>
        View Profile
      </Button>
    </div>
  );
}
