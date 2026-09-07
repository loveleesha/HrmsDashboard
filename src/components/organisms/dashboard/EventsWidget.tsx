import { CalendarClock, MapPin, Users } from "lucide-react";
import { WidgetCard } from "@/components/molecules/WidgetCard";
import { Badge } from "@/components/atoms/Badge";
import type { EventEntry, EventType } from "@/types/dashboard";

const TYPE_TONE: Record<EventType, "primary" | "info" | "success" | "warning" | "neutral"> = {
  "Town Hall": "primary",
  Workshop: "info",
  Social: "success",
  Training: "warning",
  Celebration: "neutral",
};

export function EventsWidget({ entries }: { entries: EventEntry[] }) {
  return (
    <WidgetCard title="Upcoming Events" icon={CalendarClock} className="sm:col-span-2 xl:col-span-1">
      <div className="flex flex-col gap-3">
        {entries.map((event) => {
          const [month, day] = event.date.replace(",", "").split(" ");
          return (
            <div key={event.title} className="flex gap-3 rounded-lg border border-border p-3">
              <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-primary-soft text-primary">
                <span className="text-fs-sm font-semibold uppercase leading-none">{month}</span>
                <span className="text-fs-2xl font-bold leading-tight">{day}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="truncate text-fs-base font-medium text-ink">{event.title}</p>
                  <Badge tone={TYPE_TONE[event.type]}>{event.type}</Badge>
                </div>
                <p className="flex items-center gap-1 text-fs-sm text-muted">
                  <CalendarClock className="size-3.5" />
                  {event.time}
                </p>
                <p className="flex items-center gap-1 text-fs-sm text-muted">
                  <MapPin className="size-3.5" />
                  {event.location}
                </p>
                <p className="mt-1 flex items-center gap-1 text-fs-sm text-muted-light">
                  <Users className="size-3.5" />
                  {event.attendees} attending
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </WidgetCard>
  );
}
