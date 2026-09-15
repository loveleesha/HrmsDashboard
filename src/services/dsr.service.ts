import type { DsrEntry } from "@/types/dsr";

/**
 * Mock Daily Status Report service. Replace the bodies of these functions
 * with real API calls once the Node.js backend exists.
 */

export const MOCK_DSR_ENTRIES: DsrEntry[] = [];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getDsrEntries(): Promise<DsrEntry[]> {
  await delay(200);
  return [...MOCK_DSR_ENTRIES].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function newDsrId(): string {
  return `DSR-${Math.floor(9100 + Math.random() * 800)}`;
}

export function hoursToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}
