import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-fs-sm font-medium",
  {
    variants: {
      tone: {
        neutral: "bg-surface text-muted border border-border",
        success: "bg-success-bg text-success",
        warning: "bg-warning-bg text-warning",
        info: "bg-info-bg text-info",
        danger: "bg-danger-bg text-danger",
        primary: "bg-primary-soft text-primary",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
