import { CalendarClock, Video, Phone, MapPin } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import type { Interview } from "@/types/recruitment";

const MODE_ICON = { Onsite: MapPin, Video: Video, Phone: Phone } as const;

export function InterviewsList({ interviews }: { interviews: Interview[] }) {
  const sorted = [...interviews].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface-card px-6 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary">
          <CalendarClock className="size-7" />
        </span>
        <h3 className="text-fs-2xl font-semibold text-ink">No interviews scheduled</h3>
        <p className="max-w-sm text-fs-base text-muted">Move a candidate to the Interview stage to schedule one.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((interview) => {
        const ModeIcon = MODE_ICON[interview.mode];
        return (
          <div
            key={interview.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-surface-card p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <Avatar name={interview.candidateName} size="md" />
              <div>
                <p className="text-fs-lg font-semibold text-ink">{interview.candidateName}</p>
                <p className="text-fs-base text-muted">
                  {interview.jobTitle} · {interview.round}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-fs-base text-muted sm:flex-col sm:items-end sm:gap-1">
              <span className="flex items-center gap-1.5">
                <CalendarClock className="size-4" />
                {new Date(interview.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} ·{" "}
                {interview.time}
              </span>
              <span className="flex items-center gap-1.5">
                <ModeIcon className="size-4" />
                {interview.mode} · {interview.interviewer}
              </span>
              <StatusBadge status={interview.status} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
