import type { AppraisalEntry } from "@/types/appraisal";

/**
 * Mock appraisal service. Replace the body of getMyAppraisals with a real
 * API call once the Node.js backend exists.
 */

export const MOCK_APPRAISALS: AppraisalEntry[] = [];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getMyAppraisals(): Promise<AppraisalEntry[]> {
  await delay(200);
  return MOCK_APPRAISALS;
}
