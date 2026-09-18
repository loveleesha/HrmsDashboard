/** The real backend's enum (Admin > Holidays) — "public" is its default. */
export type HolidayType = "public" | "restricted" | "optional";

export const HOLIDAY_TYPES: HolidayType[] = ["public", "restricted", "optional"];

export const HOLIDAY_TYPE_LABELS: Record<HolidayType, string> = {
  public: "Public",
  restricted: "Restricted",
  optional: "Optional",
};

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: HolidayType;
  description: string;
}

export interface HolidayPayload {
  name: string;
  date: string;
  type: HolidayType;
  description?: string;
}
