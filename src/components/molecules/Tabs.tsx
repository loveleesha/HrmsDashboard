import { cn } from "@/lib/cn";

export interface TabOption {
  label: string;
  value: string;
}

export interface TabsProps {
  options: TabOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Tabs({ options, value, onChange, className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn("inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-lg bg-surface p-1", className)}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "shrink-0 whitespace-nowrap rounded-md px-3.5 py-1.5 text-fs-base font-medium transition-colors",
            value === option.value
              ? "bg-surface-card text-ink shadow-sm"
              : "text-muted hover:text-ink"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
