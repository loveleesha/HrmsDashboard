import { cn } from "@/lib/cn";

export type StatusDotTone = "success" | "warning" | "danger" | "info" | "neutral";

const TONE_STYLES: Record<StatusDotTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  neutral: "bg-muted-light",
};

export interface StatusDotProps {
  tone: StatusDotTone;
  className?: string;
}

export function StatusDot({ tone, className }: StatusDotProps) {
  return (
    <span
      className={cn("inline-block size-2 shrink-0 rounded-full", TONE_STYLES[tone], className)}
      aria-hidden="true"
    />
  );
}
