import { Sparkles } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import type { LeaderboardEntry } from "@/services/recognition.service";

export function RecognitionLeaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-surface-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <h3 className="text-fs-lg font-semibold text-ink">Most Recognized This Month</h3>
      </div>
      <div className="flex flex-col gap-2.5">
        {entries.map((entry, index) => (
          <div key={entry.employeeId} className="flex items-center gap-3">
            <span className="w-4 text-fs-base font-medium text-muted-light">{index + 1}</span>
            <Avatar name={entry.name} size="sm" />
            <span className="flex-1 truncate text-fs-base text-ink">{entry.name}</span>
            <span className="text-fs-base font-semibold text-primary">{entry.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
