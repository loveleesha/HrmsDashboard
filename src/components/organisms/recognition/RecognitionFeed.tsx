import { Heart, Inbox } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { RecognitionBadgeChip } from "@/components/molecules/RecognitionBadgeChip";
import { getBadgeDef } from "@/services/recognition.service";
import type { Recognition } from "@/types/recognition";
import { cn } from "@/lib/cn";

export interface RecognitionFeedProps {
  recognitions: Recognition[];
  onToggleLike: (id: string) => void;
}

export function RecognitionFeed({ recognitions, onToggleLike }: RecognitionFeedProps) {
  if (recognitions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface-card px-6 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Inbox className="size-7" />
        </span>
        <h3 className="text-fs-2xl font-semibold text-ink">No recognitions yet</h3>
        <p className="max-w-sm text-fs-base text-muted">
          Be the first to celebrate a colleague&apos;s great work.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {recognitions.map((recognition) => {
        const badge = getBadgeDef(recognition.badge);
        return (
          <div key={recognition.id} className="rounded-xl border border-border bg-surface-card p-4">
            <div className="mb-3 flex items-start gap-3">
              <Avatar name={recognition.fromName} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-fs-base text-ink">
                  <span className="font-semibold">{recognition.fromName}</span> recognized{" "}
                  <span className="font-semibold">{recognition.toName}</span>
                </p>
                <p className="text-fs-sm text-muted-light">{recognition.timestamp}</p>
              </div>
            </div>

            <div className="mb-3">
              <RecognitionBadgeChip badge={badge} />
            </div>

            <p className="mb-3 text-fs-base text-ink">&ldquo;{recognition.message}&rdquo;</p>

            <button
              type="button"
              onClick={() => onToggleLike(recognition.id)}
              className={cn(
                "flex items-center gap-1.5 text-fs-base transition-colors",
                recognition.likedByMe ? "text-danger" : "text-muted hover:text-danger"
              )}
            >
              <Heart className={cn("size-4", recognition.likedByMe && "fill-danger")} />
              {recognition.likes}
            </button>
          </div>
        );
      })}
    </div>
  );
}
