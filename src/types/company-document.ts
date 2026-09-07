export const COMPANY_DOCUMENT_CATEGORIES = ["Policy", "Handbook", "Compliance", "Form", "Other"] as const;
export type CompanyDocumentCategory = (typeof COMPANY_DOCUMENT_CATEGORIES)[number];

export interface CompanyDocument {
  id: string;
  title: string;
  category: CompanyDocumentCategory;
  uploadedBy: string;
  uploadedOn: string;
  sizeKb: number;
}
