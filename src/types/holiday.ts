export type HolidayType = "National" | "Festival" | "Regional" | "Company";

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: HolidayType;
  description: string;
}
