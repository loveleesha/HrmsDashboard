import type { Employee } from "./employee";
import type { DocumentRequirementConfig, EmergencyContactDraft, Gender, QualificationEntryDraft } from "./onboarding";

export interface ProfileAddress {
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface ProfileDocument {
  key: DocumentRequirementConfig["key"];
  name: string;
  fileUrl?: string;
  fileName?: string;
}

/**
 * GET /api/user/profile (self-service) — and, by the collection's own note,
 * the same shape as Admin > Employees > Get Employee Profile. A strict
 * superset of the Employee Directory's row shape (dateOfBirth/gender/home
 * address/qualifications/emergency contacts/documents on top), so every
 * existing Employee-typed tab keeps working unchanged.
 */
export interface MyProfile extends Employee {
  dateOfBirth?: string;
  gender?: Gender | "";
  alternateMobile?: string;
  address?: ProfileAddress;
  previousCompany?: string;
  experience?: string;
  qualifications: QualificationEntryDraft[];
  emergencyContacts: EmergencyContactDraft[];
  documents: ProfileDocument[];
}
