import { getMyProfile, ProfileNotFoundError } from "@/services/profile.service";
import type { DocumentStatus, EmployeeDocument } from "@/types/document";

/**
 * "My Documents" — every document on the caller's own employee record (the
 * ones uploaded during onboarding or later), which GET /api/user/profile
 * returns in full (title, category, file, size, type, verification status).
 * An account with no employee record simply has none.
 */

function toStatus(value: string | undefined): DocumentStatus {
  const lower = value?.toLowerCase() ?? "";
  if (lower.includes("verified")) return "Verified";
  if (lower.includes("reject")) return "Rejected";
  return "Pending Review";
}

export async function getMyDocuments(): Promise<EmployeeDocument[]> {
  try {
    const profile = await getMyProfile();
    return profile.documents.map((doc) => ({
      id: doc.id,
      name: doc.name,
      category: doc.category ?? "Other",
      uploadedOn: doc.uploadedOn,
      status: toStatus(doc.verificationStatus),
      sizeBytes: doc.sizeBytes,
      mimeType: doc.mimeType,
      fileUrl: doc.fileUrl,
    }));
  } catch (err) {
    if (err instanceof ProfileNotFoundError) return [];
    throw err;
  }
}

export function formatFileSize(bytes: number | undefined): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileTypeLabel(mimeType: string | undefined): string {
  if (!mimeType) return "";
  const subtype = mimeType.split("/")[1] ?? mimeType;
  return subtype.replace(/^x-/, "").toUpperCase();
}
