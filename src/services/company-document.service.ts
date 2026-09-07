import type { CompanyDocument } from "@/types/company-document";

/**
 * Mock company document repository service. Replace the bodies of these
 * functions with real API calls once the Node.js backend exists.
 */

export const MOCK_COMPANY_DOCUMENTS: CompanyDocument[] = [
  { id: "CDOC-01", title: "Employee Handbook 2026", category: "Handbook", uploadedBy: "Ananya Iyer", uploadedOn: "2026-01-05", sizeKb: 1240 },
  { id: "CDOC-02", title: "Leave Policy", category: "Policy", uploadedBy: "Ananya Iyer", uploadedOn: "2026-01-05", sizeKb: 320 },
  { id: "CDOC-03", title: "Code of Conduct", category: "Compliance", uploadedBy: "Vikram Mehta", uploadedOn: "2026-01-05", sizeKb: 410 },
  { id: "CDOC-04", title: "IT & Data Security Policy", category: "Policy", uploadedBy: "Karan Malhotra", uploadedOn: "2026-02-14", sizeKb: 560 },
  { id: "CDOC-05", title: "Expense Reimbursement Policy", category: "Policy", uploadedBy: "Rohan Desai", uploadedOn: "2026-03-01", sizeKb: 280 },
  { id: "CDOC-06", title: "POSH Policy", category: "Compliance", uploadedBy: "Ananya Iyer", uploadedOn: "2026-01-05", sizeKb: 190 },
  { id: "CDOC-07", title: "Work From Home Guidelines", category: "Policy", uploadedBy: "Riya Kapoor", uploadedOn: "2026-04-20", sizeKb: 150 },
  { id: "CDOC-08", title: "Asset Declaration Form", category: "Form", uploadedBy: "Riya Kapoor", uploadedOn: "2026-02-01", sizeKb: 95 },
  { id: "CDOC-09", title: "Referral Bonus Policy", category: "Policy", uploadedBy: "Simran Kaur", uploadedOn: "2026-05-12", sizeKb: 130 },
  { id: "CDOC-10", title: "Notice Period & Exit Policy", category: "Policy", uploadedBy: "Ananya Iyer", uploadedOn: "2026-01-05", sizeKb: 220 },
  { id: "CDOC-11", title: "Salary Advance Request Form", category: "Form", uploadedBy: "Rohan Desai", uploadedOn: "2026-03-18", sizeKb: 80 },
  { id: "CDOC-12", title: "Diversity & Inclusion Charter", category: "Other", uploadedBy: "Vikram Mehta", uploadedOn: "2026-06-01", sizeKb: 340 },
];

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
