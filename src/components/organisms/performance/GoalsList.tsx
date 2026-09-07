import { Target } from "lucide-react";
import { Meter } from "@/components/molecules/Meter";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import type { Goal, GoalStatus } from "@/types/performance";

const STATUS_COLOR: Record<GoalStatus, string> = {
  "Not Started": "bg-muted-light",
  "On Track": "bg-info",
  "At Risk": "bg-warning",
  Completed: "bg-success",
};

export function GoalsList({ goals }: { goals: Goal[] }) {
  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface-card px-6 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Target className="size-7" />
        </span>
        <h3 className="text-fs-2xl font-semibold text-ink">No goals yet</h3>
        <p className="max-w-sm text-fs-base text-muted">Add a goal to start tracking progress for this cycle.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {goals.map((goal) => (
        <div key={goal.id} className="rounded-xl border border-border bg-surface-card p-4">
          <div className="mb-1 flex flex-wrap items-start justify-between gap-2">
            <p className="text-fs-lg font-semibold text-ink">{goal.title}</p>
            <StatusBadge status={goal.status} />
          </div>
          <p className="mb-3 text-fs-base text-muted">{goal.description}</p>
          <Meter value={goal.progress} colorClassName={STATUS_COLOR[goal.status]} />
          <div className="mt-1.5 flex items-center justify-between text-fs-sm text-muted-light">
            <span>{goal.progress}% complete</span>
            <span>
              Due {new Date(goal.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
