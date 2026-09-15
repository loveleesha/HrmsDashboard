import type { EmployeeDocument } from "@/types/document";

/**
 * Mock employee documents service. Replace the body of getMyDocuments with
 * a real API call once the Node.js backend exists.
 */

export const MOCK_DOCUMENTS: EmployeeDocument[] = [];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getMyDocuments(): Promise<EmployeeDocument[]> {
  await delay(200);
  return MOCK_DOCUMENTS;
}
