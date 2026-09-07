import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/cn";
import type { DashboardStat } from "@/types/dashboard";

const TREND_STYLES = {
  up: { icon: ArrowUp, className: "text-success" },
  down: { icon: ArrowDown, className: "text-danger" },
  flat: { icon: Minus, className: "text-muted" },
};

export interface StatCardProps extends DashboardStat {
  icon?: LucideIcon;
}

export function StatCard({ label, value, delta, trend, icon: IconComponent }: StatCardProps) {
  const trendMeta = trend ? TREND_STYLES[trend] : null;
  const TrendIcon = trendMeta?.icon;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-fs-base text-muted">{label}</span>
        {IconComponent && (
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <IconComponent className="size-4" />
          </span>
        )}
      </div>
      <span className="text-fs-6xl font-semibold text-ink">{value}</span>
      {delta && (
        <span
          className={cn(
            "inline-flex items-center gap-1 text-fs-sm",
            trendMeta?.className ?? "text-muted"
          )}
        >
          {TrendIcon && <TrendIcon className="size-3" />}
          {delta}
        </span>
      )}
    </div>
  );
}
