import type { Employee } from "./employee";
import type { EmergencyContactDraft, Gender, QualificationEntryDraft } from "./onboarding";

export interface ProfileAddress {
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

/** One uploaded document as the profile endpoint returns it (title, category, file, verification). */
export interface ProfileDocument {
  id: string;
  name: string;
  category?: string;
  fileUrl?: string;
  fileName?: string;
  /** e.g. "Pending Review" | "Verified" | "Rejected" */
  verificationStatus?: string;
  sizeBytes?: number;
  mimeType?: string;
  uploadedOn?: string;
}

/**
 * GET /api/user/profile (self-service) — and, by the collection's own note,
 * the same shape as Admin > Employees > Get Employee Profile. A strict
 * superset of the Employee Directory's row shape (dateOfBirth/gender/home
 * address/qualifications/emergency contacts/documents on top), so every
 * existing Employee-typed tab keeps working unchanged.
 */
export interface MyProfile extends Employee {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: Gender | "";
  alternateMobile?: string;
  /** Human label of the resolved Role document (Employee.role holds its machine name). */
  roleLabel?: string;
  /** The account's userType from User (admin | hr | employee). */
  userType?: string;
  address?: ProfileAddress;
  previousCompany?: string;
  experience?: string;
  qualifications: QualificationEntryDraft[];
  emergencyContacts: EmergencyContactDraft[];
  documents: ProfileDocument[];
}
