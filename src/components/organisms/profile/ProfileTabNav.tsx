import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface ProfileTabDef {
  value: string;
  label: string;
  icon: LucideIcon;
}

export interface ProfileTabNavProps {
  tabs: ProfileTabDef[];
  value: string;
  onChange: (value: string) => void;
}

export function ProfileTabNav({ tabs, value, onChange }: ProfileTabNavProps) {
  return (
    <nav className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface-card p-2 lg:flex-col lg:overflow-visible">
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-fs-base transition-colors lg:gap-3 lg:text-fs-lg",
              active ? "bg-primary text-white font-medium" : "text-ink hover:bg-surface"
            )}
          >
            <tab.icon className="size-[18px] shrink-0" />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
