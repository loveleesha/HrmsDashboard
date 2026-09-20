"use client";

import { useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover } from "@/components/molecules/Popover";
import { cn } from "@/lib/cn";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toKey(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}
function parseKey(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return match ? { year: Number(match[1]), month: Number(match[2]) - 1, day: Number(match[3]) } : null;
}
function todayKey() {
  const now = new Date();
  return toKey(now.getFullYear(), now.getMonth(), now.getDate());
}
function formatDisplay(value: string) {
  const parsed = parseKey(value);
  if (!parsed) return "";
  return new Date(parsed.year, parsed.month, parsed.day).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export interface DatePickerProps {
  id?: string;
  /** YYYY-MM-DD, or "" for none. */
  value: string;
  onChange: (value: string) => void;
  /** Inclusive YYYY-MM-DD bounds; days outside are greyed out and unselectable. */
  min?: string;
  max?: string;
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  /** Show a "Clear" action (for optional dates). */
  clearable?: boolean;
  className?: string;
}

/** Themed calendar popover — replaces the browser's native date input so every date field matches the app. */
export function DatePicker({ id, value, onChange, min, max, placeholder = "Select date", invalid, disabled, clearable, className }: DatePickerProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [wasOpen, setWasOpen] = useState(false);
  const [view, setView] = useState(() => {
    const parsed = parseKey(value) ?? parseKey(todayKey())!;
    return { year: parsed.year, month: parsed.month };
  });

  // Each time it opens, jump the calendar to the selected date's month (adjusted during render, not in an effect).
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      const parsed = parseKey(value) ?? parseKey(todayKey())!;
      setView({ year: parsed.year, month: parsed.month });
    }
  }

  const today = todayKey();
  const minYear = min ? (parseKey(min)?.year ?? 1900) : new Date().getFullYear() - 100;
  const maxYear = max ? (parseKey(max)?.year ?? 2100) : new Date().getFullYear() + 10;
  const years = Array.from({ length: Math.max(1, maxYear - minYear + 1) }, (_, i) => maxYear - i);

  const firstWeekday = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  function isDisabled(key: string) {
    return Boolean((min && key < min) || (max && key > max));
  }
  function shiftMonth(delta: number) {
    setView((prev) => {
      const next = new Date(prev.year, prev.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  }
  function select(key: string) {
    onChange(key);
    setOpen(false);
  }

  const todayDisabled = isDisabled(today);
  const prevDisabled = Boolean(min && toKey(view.year, view.month, 1) <= min);
  const nextDisabled = Boolean(max && toKey(view.year, view.month, daysInMonth) >= max);

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "relative flex h-10 w-full items-center rounded-lg border bg-surface-card pl-9 pr-3 text-left text-fs-lg transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50",
          invalid ? "border-danger" : open ? "border-primary" : "border-border hover:border-border-strong",
          className
        )}
      >
        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-light" />
        <span className={cn("truncate", value ? "text-ink" : "text-muted-light")}>{value ? formatDisplay(value) : placeholder}</span>
      </button>

      <Popover open={open} anchorRef={triggerRef} onClose={() => setOpen(false)} width={256} ariaLabel="Choose a date">
        <div className="mb-2 flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            disabled={prevDisabled}
            aria-label="Previous month"
            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-ink disabled:opacity-30"
          >
            <ChevronLeft className="size-4" />
          </button>
          <select
            aria-label="Month"
            value={view.month}
            onChange={(e) => setView((prev) => ({ ...prev, month: Number(e.target.value) }))}
            className="h-7 min-w-0 flex-1 rounded-lg bg-surface px-2 text-fs-base font-medium text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {MONTHS.map((name, index) => (
              <option key={name} value={index}>
                {name}
              </option>
            ))}
          </select>
          <select
            aria-label="Year"
            value={view.year}
            onChange={(e) => setView((prev) => ({ ...prev, year: Number(e.target.value) }))}
            className="h-7 w-[4.5rem] rounded-lg bg-surface px-1.5 text-fs-base font-medium text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {(years.includes(view.year) ? years : [view.year, ...years]).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            disabled={nextDisabled}
            aria-label="Next month"
            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-ink disabled:opacity-30"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-y-0.5 text-center">
          {WEEKDAYS.map((day) => (
            <span key={day} className="py-0.5 text-fs-sm font-medium text-muted-light">
              {day}
            </span>
          ))}
          {cells.map((day, index) => {
            if (day === null) return <span key={`blank-${index}`} />;
            const key = toKey(view.year, view.month, day);
            const selected = key === value;
            const disabledDay = isDisabled(key);
            return (
              <button
                key={key}
                type="button"
                disabled={disabledDay}
                onClick={() => select(key)}
                aria-label={formatDisplay(key)}
                aria-pressed={selected}
                className={cn(
                  "mx-auto flex size-8 items-center justify-center rounded-full text-fs-base transition-colors",
                  selected
                    ? "bg-primary font-semibold text-white"
                    : key === today
                      ? "font-semibold text-primary ring-1 ring-primary/40 hover:bg-primary-soft"
                      : "text-ink hover:bg-primary-soft",
                  disabledDay && "cursor-not-allowed text-muted-light/50 hover:bg-transparent"
                )}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
          <button
            type="button"
            disabled={todayDisabled}
            onClick={() => select(today)}
            className="rounded-lg px-2 py-0.5 text-fs-base font-medium text-primary hover:bg-primary-soft disabled:opacity-40"
          >
            Today
          </button>
          {clearable && value && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="rounded-lg px-2 py-0.5 text-fs-base text-muted hover:bg-surface hover:text-ink"
            >
              Clear
            </button>
          )}
        </div>
      </Popover>
    </>
  );
}
