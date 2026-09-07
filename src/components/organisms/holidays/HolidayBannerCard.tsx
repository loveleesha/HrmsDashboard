import { PartyPopper, Gift, Sparkles, Flag, Sun } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import type { Holiday, HolidayType } from "@/types/holiday";
import { cn } from "@/lib/cn";

const TYPE_ICON: Record<HolidayType, typeof PartyPopper> = {
  National: Flag,
  Festival: PartyPopper,
  Regional: Sun,
  Company: Gift,
};

const TYPE_TONE: Record<HolidayType, "primary" | "info" | "success" | "warning"> = {
  National: "info",
  Festival: "primary",
  Regional: "success",
  Company: "warning",
};

const BANNER_THEMES = [
  "from-primary to-primary-dark",
  "from-birthday-purple to-birthday-purple-soft",
  "from-info to-birthday-purple",
  "from-birthday-gold to-birthday-accent",
  "from-success to-info",
];

export interface HolidayBannerCardProps {
  holiday: Holiday;
  bannerIndex: number;
  daysAway: number | null;
}

export function HolidayBannerCard({ holiday, bannerIndex, daysAway }: HolidayBannerCardProps) {
  const TypeIcon = TYPE_ICON[holiday.type];
  const theme = BANNER_THEMES[bannerIndex % BANNER_THEMES.length];
  const date = new Date(holiday.date);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface-card">
      <div className={cn("relative flex h-32 flex-col items-center justify-center gap-1 bg-gradient-to-br text-white", theme)}>
        <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 size-28 rounded-full bg-white/10" />
        <Sparkles className="pointer-events-none absolute right-4 top-4 size-4 text-white/70" />
        <TypeIcon className="relative size-9" />
        <p className="relative px-4 text-center text-fs-xl font-bold leading-tight">{holiday.name}</p>
      </div>

      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-fs-lg font-semibold text-ink">
              {date.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
            <p className="text-fs-sm text-muted">{date.toLocaleDateString("en-IN", { weekday: "long" })}</p>
          </div>
          <Badge tone={TYPE_TONE[holiday.type]}>{holiday.type}</Badge>
        </div>

        <p className="text-fs-base text-muted">{holiday.description}</p>

        {daysAway !== null && (
          <span
            className={cn(
              "mt-1 inline-flex w-fit items-center rounded-full px-2.5 py-1 text-fs-sm font-medium",
              daysAway === 0 ? "bg-success-bg text-success" : "bg-surface text-muted"
            )}
          >
            {daysAway === 0 ? "Today" : `In ${daysAway} ${daysAway === 1 ? "day" : "days"}`}
          </span>
        )}
      </div>
    </div>
  );
}
