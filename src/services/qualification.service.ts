import type { QualificationEntry } from "@/types/qualification";

/**
 * Mock qualification service. Replace the body of getMyQualifications with
 * a real API call once the Node.js backend exists.
 */

export const MOCK_QUALIFICATIONS: QualificationEntry[] = [];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getMyQualifications(): Promise<QualificationEntry[]> {
  await delay(200);
  return MOCK_QUALIFICATIONS;
}

export function newQualificationId(): string {
  return `QUAL-${Math.floor(10 + Math.random() * 89)}`;
}
