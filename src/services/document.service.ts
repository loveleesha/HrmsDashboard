import type { EmployeeDocument } from "@/types/document";

/**
 * Mock employee documents service. Replace the body of getMyDocuments with
 * a real API call once the Node.js backend exists.
 */

export const MOCK_DOCUMENTS: EmployeeDocument[] = [
  { id: "DOC-01", name: "Offer Letter.pdf", category: "Employment", uploadedOn: "2022-03-10", status: "Verified", sizeKb: 214 },
  { id: "DOC-02", name: "PAN Card.pdf", category: "Identity", uploadedOn: "2022-03-11", status: "Verified", sizeKb: 96 },
  { id: "DOC-03", name: "Aadhaar Card.pdf", category: "Identity", uploadedOn: "2022-03-11", status: "Verified", sizeKb: 118 },
  { id: "DOC-04", name: "Bank Passbook.pdf", category: "Financial", uploadedOn: "2022-03-14", status: "Verified", sizeKb: 87 },
  { id: "DOC-05", name: "Relieving Letter (Previous Employer).pdf", category: "Employment", uploadedOn: "2022-03-15", status: "Pending Review", sizeKb: 154 },
];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getMyDocuments(): Promise<EmployeeDocument[]> {
  await delay(200);
  return MOCK_DOCUMENTS;
}
