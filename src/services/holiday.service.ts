import type { Holiday } from "@/types/holiday";

/**
 * Mock holiday calendar service. Replace the body of getHolidays with a
 * real API call once the Node.js backend exists.
 */

export const MOCK_HOLIDAYS: Holiday[] = [
  { id: "HOL-01", name: "Republic Day", date: "2026-01-26", type: "National", description: "Commemorates the adoption of the Constitution of India." },
  { id: "HOL-02", name: "Holi", date: "2026-03-06", type: "Festival", description: "The festival of colors — office remains closed for the day." },
  { id: "HOL-03", name: "Independence Day", date: "2026-08-15", type: "National", description: "Marks India's independence — flag hoisting at the main office at 9 AM." },
  { id: "HOL-04", name: "Ganesh Chaturthi", date: "2026-09-14", type: "Festival", description: "Celebration in honor of Lord Ganesha, observed across the Mumbai and Pune offices." },
  { id: "HOL-05", name: "Gandhi Jayanti", date: "2026-10-02", type: "National", description: "Birth anniversary of Mahatma Gandhi." },
  { id: "HOL-06", name: "Diwali", date: "2026-10-20", type: "Festival", description: "The festival of lights — offices closed for two days including the day after." },
  { id: "HOL-07", name: "Christmas", date: "2026-12-25", type: "Festival", description: "Celebrated company-wide with a holiday potluck the preceding Friday." },
];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getHolidays(): Promise<Holiday[]> {
  await delay(200);
  return [...MOCK_HOLIDAYS].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
