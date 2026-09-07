import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";

export interface ModulePlaceholderProps {
  title: string;
  description: string;
  icon?: LucideIcon;
}

export function ModulePlaceholder({
  title,
  description,
  icon: IconComponent = Construction,
}: ModulePlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface-card px-6 py-20 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary">
        <IconComponent className="size-7" />
      </span>
      <h2 className="text-fs-4xl font-semibold text-ink">{title}</h2>
      <p className="max-w-md text-fs-lg text-muted">{description}</p>
      <p className="text-fs-sm text-muted-light">
        This module is on the HRMS roadmap and will be built out in an upcoming phase.
      </p>
    </div>
  );
}
