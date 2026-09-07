import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface WidgetCardProps {
  title: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function WidgetCard({
  title,
  icon: IconComponent,
  action,
  children,
  className,
}: WidgetCardProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-surface-card p-4", className)}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {IconComponent && <IconComponent className="size-4 text-primary" />}
          <h3 className="text-fs-xl font-semibold text-ink">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
