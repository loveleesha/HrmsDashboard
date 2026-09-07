import type { RecognitionBadgeDef } from "@/types/recognition";
import { cn } from "@/lib/cn";

export interface RecognitionBadgeChipProps {
  badge: RecognitionBadgeDef;
  selected?: boolean;
  onClick?: () => void;
}

export function RecognitionBadgeChip({ badge, selected, onClick }: RecognitionBadgeChipProps) {
  const BadgeIcon = badge.icon;
  const isInteractive = Boolean(onClick);

  const content = (
    <>
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          selected ? "bg-primary text-white" : "bg-primary-soft text-primary"
        )}
      >
        <BadgeIcon className="size-4" />
      </span>
      <span className="text-fs-base font-medium text-ink">{badge.label}</span>
    </>
  );

  if (!isInteractive) {
    return <span className="inline-flex items-center gap-2">{content}</span>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors",
        selected ? "border-primary bg-primary-softer" : "border-border bg-surface-card hover:border-border-strong"
      )}
    >
      {content}
    </button>
  );
}
