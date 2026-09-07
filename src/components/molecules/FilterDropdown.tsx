import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterDropdownProps {
  label: string;
  /** Overrides the accessible name when `label` (used as the placeholder option) isn't unique enough on its own, e.g. two dropdowns both showing "All". */
  ariaLabel?: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function FilterDropdown({
  label,
  ariaLabel,
  options,
  value,
  onChange,
  className,
}: FilterDropdownProps) {
  return (
    <div className={cn("relative", className)}>
      <select
        aria-label={ariaLabel ?? label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full appearance-none rounded-lg border border-border bg-surface-card pl-3 pr-9 text-fs-lg text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        <option value="">{label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-light" />
    </div>
  );
}
