/**
 * Small, shared "basic validation" helpers for the hand-rolled forms (the
 * wizard uses Zod schemas instead). Each returns an error message or
 * undefined — "required" checks stay in the form itself, so these only judge
 * a value once it's been filled in.
 */

export interface TextRule {
  min?: number;
  max: number;
}

export function textError(value: string, label: string, { min, max }: TextRule): string | undefined {
  const length = value.trim().length;
  if (length === 0) return undefined;
  if (min && length < min) return `${label} must be at least ${min} characters.`;
  if (length > max) return `${label} must be ${max} characters or fewer.`;
  return undefined;
}

/** Runs textError over several fields at once, keeping any error the form already set for a field. */
export function applyTextRules(
  errors: Record<string, string>,
  rules: Record<string, [value: string, label: string, rule: TextRule]>
) {
  for (const [field, [value, label, rule]] of Object.entries(rules)) {
    const message = textError(value, label, rule);
    if (message && !errors[field]) errors[field] = message;
  }
}

/** Today as YYYY-MM-DD in the user's local time (toISOString would use UTC and be off by a day near midnight). */
export function todayKey(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function isFutureDate(yyyyMmDd: string): boolean {
  return yyyyMmDd > todayKey();
}

export function isPastDate(yyyyMmDd: string): boolean {
  return yyyyMmDd < todayKey();
}

/** "HH:MM" worked-time value: 0-24 hours, 0-59 minutes, more than zero, at most one day. */
export function hoursError(value: string): string | undefined {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return "Enter hours as HH:MM, e.g. 02:30.";
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (minutes > 59) return "Minutes must be between 00 and 59.";
  const total = hours * 60 + minutes;
  if (total === 0) return "Hours must be more than 00:00.";
  if (total > 24 * 60) return "A day can't have more than 24 hours.";
  return undefined;
}
