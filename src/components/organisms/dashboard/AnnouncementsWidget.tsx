import { Megaphone } from "lucide-react";
import { WidgetCard } from "@/components/molecules/WidgetCard";
import { Badge } from "@/components/atoms/Badge";
import type { AnnouncementEntry } from "@/types/dashboard";

export function AnnouncementsWidget({ entries }: { entries: AnnouncementEntry[] }) {
  return (
    <WidgetCard title="Company Announcements" icon={Megaphone}>
      <ul className="flex flex-col gap-4">
        {entries.map((entry) => (
          <li key={entry.title}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="text-fs-base font-medium text-ink">{entry.title}</p>
              {entry.priority === "High" && <Badge tone="danger">High</Badge>}
            </div>
            <p className="text-fs-sm text-muted">{entry.body}</p>
            <p className="mt-1 text-fs-sm text-muted-light">
              {entry.postedBy} • {entry.date}
            </p>
          </li>
        ))}
      </ul>
    </WidgetCard>
  );
}
