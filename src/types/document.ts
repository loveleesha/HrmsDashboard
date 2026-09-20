export type DocumentStatus = "Verified" | "Pending Review" | "Rejected";

export interface EmployeeDocument {
  id: string;
  name: string;
  category: string;
  uploadedOn?: string;
  status: DocumentStatus;
  sizeBytes?: number;
  mimeType?: string;
  fileUrl?: string;
}
