import type { CompanyDocument } from "@/types/company-document";

/**
 * Mock company document repository service. Replace the bodies of these
 * functions with real API calls once the Node.js backend exists.
 */

export const MOCK_COMPANY_DOCUMENTS: CompanyDocument[] = [];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getCompanyDocuments(): Promise<CompanyDocument[]> {
  await delay(200);
  return [...MOCK_COMPANY_DOCUMENTS].sort((a, b) => new Date(b.uploadedOn).getTime() - new Date(a.uploadedOn).getTime());
}

export function newCompanyDocumentId(): string {
  return `CDOC-${Math.floor(10 + Math.random() * 89)}`;
}
