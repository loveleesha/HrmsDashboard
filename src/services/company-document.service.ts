import { httpService } from "@/lib/http/http.service";
import { API_ENDPOINTS } from "@/lib/apiEndpoint";
import type { CompanyDocument, CompanyDocumentCategory } from "@/types/company-document";

/**
 * Company document library — wired to the real HRMS backend's Admin >
 * Documents API (see the "HRMS API" Postman collection). List/Download are
 * gated on documents.view (every role, intentionally — same as Holidays/
 * Departments/Projects); Publish/Update/Delete need documents.edit/.delete
 * (deliberately not documents.add, which every role gets by default for
 * self-service elsewhere).
 */

interface RawUploader {
  id?: string;
  _id?: string;
  name?: string;
}

interface RawCompanyDocument {
  id?: string;
  _id?: string;
  title?: string;
  category?: string;
  uploadedBy?: RawUploader | string | null;
  fileSize?: number;
  mimeType?: string;
  createdAt?: string;
}

function mapDocument(raw: RawCompanyDocument): CompanyDocument {
  const uploader = typeof raw.uploadedBy === "object" && raw.uploadedBy ? raw.uploadedBy : undefined;
  return {
    id: raw.id ?? raw._id ?? "",
    title: raw.title ?? "",
    category: (raw.category as CompanyDocumentCategory) ?? "Other",
    uploadedBy: uploader?.name ?? (typeof raw.uploadedBy === "string" ? raw.uploadedBy : "—"),
    uploadedOn: raw.createdAt ?? "",
    sizeKb: Math.round((raw.fileSize ?? 0) / 1024),
  };
}

// This backend's list endpoints have been seen wrapping under the singular
// resource name (e.g. Admin > Leave's { "leave": [...] }) rather than the
// plural — check both.
function unwrap(data: { document?: RawCompanyDocument[]; documents?: RawCompanyDocument[] } | RawCompanyDocument[]): RawCompanyDocument[] {
  return Array.isArray(data) ? data : (data.documents ?? data.document ?? []);
}

function byUploadedDesc(a: CompanyDocument, b: CompanyDocument) {
  return new Date(b.uploadedOn).getTime() - new Date(a.uploadedOn).getTime();
}

export async function getCompanyDocuments(category?: string): Promise<CompanyDocument[]> {
  const data = await httpService.get<Parameters<typeof unwrap>[0]>(
    API_ENDPOINTS.admin.documents,
    category ? { category } : undefined
  );
  return unwrap(data).map(mapDocument).sort(byUploadedDesc);
}

/** multipart/form-data: title, category, file (jpeg/png/webp/pdf, up to 10MB). */
export async function publishCompanyDocument(payload: {
  title: string;
  category: CompanyDocumentCategory;
  file: File;
}): Promise<CompanyDocument> {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("category", payload.category);
  formData.append("file", payload.file);
  const data = await httpService.post<{ document?: RawCompanyDocument } | RawCompanyDocument>(
    API_ENDPOINTS.admin.documents,
    formData
  );
  return mapDocument("document" in data && data.document ? data.document : (data as RawCompanyDocument));
}

/** title/category only — the file itself can't be replaced; publish a new document instead. */
export async function updateCompanyDocument(id: string, payload: Partial<{ title: string; category: CompanyDocumentCategory }>): Promise<void> {
  await httpService.patch(API_ENDPOINTS.admin.documentById(id), payload);
}

export async function deleteCompanyDocument(id: string): Promise<void> {
  await httpService.delete(API_ENDPOINTS.admin.documentById(id));
}

/** An authenticated stream, not a public static URL — fetched as a blob
 * through the shared Bearer-token Axios instance and saved client-side. */
export async function downloadCompanyDocument(id: string, fileName: string): Promise<void> {
  const blob = await httpService.get<Blob>(API_ENDPOINTS.admin.documentDownload(id), undefined, { responseType: "blob" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
