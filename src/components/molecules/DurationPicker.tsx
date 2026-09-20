"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Clock } from "lucide-react";
import { Popover } from "@/components/molecules/Popover";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/cn";

const DIAL = 184;
const CENTER = DIAL / 2;
const OUTER_RADIUS = 76;
const INNER_RADIUS = 49;
const RING_SPLIT = (OUTER_RADIUS + INNER_RADIUS) / 2;

/** Outer ring, clockwise from the top: 12, 1 … 11. Inner ring: 0, 13 … 23 (a 24-hour dial). */
const OUTER_HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const INNER_HOURS = [0, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
const MINUTE_MARKS = Array.from({ length: 12 }, (_, i) => i * 5);

const PRESETS = [
  { label: "30m", value: "00:30" },
  { label: "1h", value: "01:00" },
  { label: "2h", value: "02:00" },
  { label: "4h", value: "04:00" },
  { label: "8h", value: "08:00" },
];

const pad = (n: number) => String(n).padStart(2, "0");

function parse(value: string): { hours: number; minutes: number } | null {
  const match = /^(\d{1,2}):(\d{1,2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours <= 23 && minutes <= 59 ? { hours, minutes } : null;
}

function polar(index: number, count: number, radius: number) {
  const angle = (index / count) * 2 * Math.PI;
  return { x: CENTER + radius * Math.sin(angle), y: CENTER - radius * Math.cos(angle) };
}

export interface DurationPickerProps {
  id?: string;
  /** "HH:MM" as typed or picked (may be partial while typing). */
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * "HH:MM" field you can type into, plus a clock dial to pick with: choose the
 * hour on the outer/inner ring (drag or tap), then the minute. Presets cover
 * the common cases in one tap.
 */
export function DurationPicker({ id, value, onChange, invalid, disabled, placeholder = "HH:MM" }: DurationPickerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dialRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"hours" | "minutes">("hours");
  const [dragging, setDragging] = useState(false);

  const parsed = parse(value) ?? { hours: 0, minutes: 0 };
  const { hours, minutes } = parsed;

  function commit(nextHours: number, nextMinutes: number) {
    onChange(`${pad(nextHours)}:${pad(nextMinutes)}`);
  }

  function pickFromPointer(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = dialRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const degrees = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
    if (step === "hours") {
      const index = Math.round(degrees / 30) % 12;
      const inner = Math.hypot(dx, dy) < (RING_SPLIT * rect.width) / DIAL;
      commit(inner ? INNER_HOURS[index] : OUTER_HOURS[index], minutes);
    } else {
      commit(hours, Math.round(degrees / 6) % 60);
    }
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    pickFromPointer(event);
  }

  function handlePointerUp() {
    setDragging(false);
    if (step === "hours") setStep("minutes");
  }

  function openPicker() {
    setStep("hours");
    setOpen((prev) => !prev);
  }

  function normalizeOnBlur() {
    const match = /^(\d{1,2}):(\d{1,2})$/.exec(value.trim());
    if (match) onChange(`${match[1].padStart(2, "0")}:${match[2].padStart(2, "0")}`);
  }

  // The selection marker + hand: hours use the ring the hour lives on, minutes always the outer ring.
  const marker =
    step === "hours"
      ? hours >= 1 && hours <= 12
        ? { index: hours % 12, radius: OUTER_RADIUS, count: 12 }
        : { index: hours === 0 ? 0 : hours - 12, radius: INNER_RADIUS, count: 12 }
      : { index: minutes, radius: OUTER_RADIUS, count: 60 };
  const markerPoint = polar(marker.index, marker.count, marker.radius);
  const handAngle = (marker.index / marker.count) * 360;

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        maxLength={5}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        invalid={invalid}
        onChange={(e) => onChange(e.target.value.replace(/[^\d:]/g, ""))}
        onBlur={normalizeOnBlur}
        className="pr-11"
      />
      <button
        type="button"
        disabled={disabled}
        onClick={openPicker}
        aria-label="Open clock to pick hours"
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "absolute right-1 top-1 flex size-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-primary-soft hover:text-primary disabled:opacity-40",
          open && "bg-primary-soft text-primary"
        )}
      >
        <Clock className="size-4" />
      </button>

      <Popover open={open} anchorRef={wrapperRef} onClose={() => setOpen(false)} width={252} ariaLabel="Pick hours and minutes">
        <div className="mb-1 flex items-center justify-center gap-0.5 text-fs-5xl font-semibold leading-tight tabular-nums">
          <button
            type="button"
            onClick={() => setStep("hours")}
            aria-label="Choose hours"
            className={cn("rounded-md px-1.5 transition-colors", step === "hours" ? "bg-primary-soft text-primary" : "text-ink hover:bg-surface")}
          >
            {pad(hours)}
          </button>
          <span className="text-muted-light">:</span>
          <button
            type="button"
            onClick={() => setStep("minutes")}
            aria-label="Choose minutes"
            className={cn("rounded-md px-1.5 transition-colors", step === "minutes" ? "bg-primary-soft text-primary" : "text-ink hover:bg-surface")}
          >
            {pad(minutes)}
          </button>
        </div>
        <p className="mb-2 text-center text-fs-sm text-muted">{step === "hours" ? "Select hours" : "Select minutes"}</p>

        <div
          ref={dialRef}
          role="group"
          aria-label={step === "hours" ? "Hours dial" : "Minutes dial"}
          onPointerDown={handlePointerDown}
          onPointerMove={(event) => dragging && pickFromPointer(event)}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => setDragging(false)}
          className="relative mx-auto touch-none select-none rounded-full bg-surface"
          style={{ width: DIAL, height: DIAL }}
        >
          <div
            className="pointer-events-none absolute left-1/2 bottom-1/2 w-0.5 -translate-x-1/2 origin-bottom bg-primary"
            style={{ height: marker.radius, transform: `translateX(-50%) rotate(${handAngle}deg)` }}
          />
          <span className="pointer-events-none absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" style={{ left: CENTER, top: CENTER }} />
          <span
            className={cn("pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary", marker.radius === INNER_RADIUS && step === "hours" ? "size-6" : "size-7")}
            style={{ left: markerPoint.x, top: markerPoint.y }}
          />

          {step === "hours"
            ? [
                ...OUTER_HOURS.map((h, i) => ({ h, ...polar(i, 12, OUTER_RADIUS), small: false })),
                ...INNER_HOURS.map((h, i) => ({ h, ...polar(i, 12, INNER_RADIUS), small: true })),
              ].map(({ h, x, y, small }) => (
                <span
                  key={`${small ? "i" : "o"}-${h}`}
                  className={cn(
                    "pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full tabular-nums",
                    small ? "size-6 text-fs-md" : "size-7 text-fs-base",
                    h === hours ? "font-semibold text-white" : "text-ink"
                  )}
                  style={{ left: x, top: y }}
                >
                  {pad(h)}
                </span>
              ))
            : MINUTE_MARKS.map((m) => {
                const point = polar(m, 60, OUTER_RADIUS);
                return (
                  <span
                    key={m}
                    className={cn(
                      "pointer-events-none absolute flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-fs-base tabular-nums",
                      m === minutes ? "font-semibold text-white" : "text-ink"
                    )}
                    style={{ left: point.x, top: point.y }}
                  >
                    {pad(m)}
                  </span>
                );
              })}
        </div>

        <div className="mt-2.5 flex flex-wrap justify-center gap-1">
          {PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => {
                onChange(preset.value);
                setOpen(false);
              }}
              className={cn(
                "rounded-full border px-2 py-0.5 text-fs-sm font-medium transition-colors",
                value === preset.value ? "border-primary bg-primary-soft text-primary" : "border-border text-muted hover:border-primary hover:text-primary"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="mt-2.5 flex justify-between gap-2 border-t border-border pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            Clear
          </Button>
          <Button type="button" size="sm" onClick={() => setOpen(false)}>
            Done
          </Button>
        </div>
      </Popover>
    </div>
  );
}
