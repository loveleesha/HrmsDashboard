import type { Holiday } from "@/types/holiday";

/**
 * Mock holiday calendar service. Replace the body of getHolidays with a
 * real API call once the Node.js backend exists.
 */

export const MOCK_HOLIDAYS: Holiday[] = [];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getHolidays(): Promise<Holiday[]> {
  await delay(200);
  return [...MOCK_HOLIDAYS].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
