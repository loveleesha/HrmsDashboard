import { UserPlus } from "lucide-react";
import { WidgetCard } from "@/components/molecules/WidgetCard";
import { Carousel } from "@/components/molecules/Carousel";
import { Avatar } from "@/components/atoms/Avatar";
import type { NewJoineeEntry } from "@/types/dashboard";

export function NewJoineesWidget({ entries }: { entries: NewJoineeEntry[] }) {
  return (
    <WidgetCard title="New Joinees" icon={UserPlus}>
      {entries.length === 0 ? (
        <p className="py-10 text-center text-fs-base text-muted">No new joinees to show.</p>
      ) : (
        <Carousel
          slides={entries.map((entry) => (
            <div
              key={entry.name}
              className="relative flex flex-col items-center gap-2 overflow-hidden rounded-xl bg-info-bg px-4 py-6 text-center"
            >
              <Avatar name={entry.name} size="lg" />
              <p className="text-fs-xl font-semibold text-ink">{entry.name}</p>
              <p className="text-fs-base text-muted">{entry.designation}</p>
              <p className="text-fs-sm text-muted-light">{entry.department}</p>
              <span className="mt-1 rounded-full bg-info/15 px-3 py-1 text-fs-base font-medium text-info">
                Joined {entry.joinedOn}
              </span>
            </div>
          ))}
        />
      )}
    </WidgetCard>
  );
}
