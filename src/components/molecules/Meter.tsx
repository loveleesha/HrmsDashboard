import { cn } from "@/lib/cn";

export interface MeterProps {
  value: number;
  colorClassName?: string;
  className?: string;
}

export function Meter({ value, colorClassName = "bg-primary", className }: MeterProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface", className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full transition-all", colorClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
