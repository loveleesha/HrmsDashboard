import { History } from "lucide-react";
import { WidgetCard } from "@/components/molecules/WidgetCard";
import type { ActivityEntry } from "@/types/dashboard";

export function RecentActivityWidget({ entries }: { entries: ActivityEntry[] }) {
  return (
    <WidgetCard title="Recent Activity" icon={History}>
      <ul className="flex flex-col gap-3">
        {entries.map((entry, index) => (
          <li key={index} className="flex gap-3">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
            <div className="min-w-0">
              <p className="text-fs-base text-ink">
                <span className="font-medium">{entry.actor}</span> {entry.action}
              </p>
              <p className="text-fs-sm text-muted-light">{entry.timestamp}</p>
            </div>
          </li>
        ))}
      </ul>
    </WidgetCard>
  );
}
