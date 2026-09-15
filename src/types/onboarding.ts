import type { Role } from "./user";

export const GENDERS = ["male", "female", "other", "Prefer not to say"] as const;
export type Gender = (typeof GENDERS)[number];

/** Display labels — the values above match the backend's expected casing,
 * which isn't what should show up in the UI. */
export const GENDER_LABELS: Record<Gender, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
  "Prefer not to say": "Prefer not to say",
};

export const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Intern"] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

/**
 * Roles assignable during onboarding now come live from Settings -> Role &
 * Access (see useRoles()/role.service.ts) — this is just the fallback
 * starting value before a role is picked.
 */
export const DEFAULT_ONBOARDING_ROLE: Role = "employee";

/**
 * Roles only an Admin/Super Admin should be able to hand out during
 * onboarding. The UI hides these from anyone without `employeeOnboarding`
 * "assignElevatedRoles" — the backend is the real gate, this just keeps the
 * form honest about what a given user is allowed to pick.
 */
export const ELEVATED_ONBOARDING_ROLES: Role[] = ["super_admin", "hr_admin"];

export const ONBOARDING_STEP_KEYS = [
  "basicInfo",
  "contactInfo",
  "professionalInfo",
  "roleAccess",
  "technology",
  "qualification",
  "emergencyContacts",
  "documents",
  "review",
] as const;
export type OnboardingStepKey = (typeof ONBOARDING_STEP_KEYS)[number];

export const ONBOARDING_STEP_LABELS: Record<OnboardingStepKey, string> = {
  basicInfo: "Basic Information",
  contactInfo: "Contact Information",
  professionalInfo: "Professional Information",
  roleAccess: "Role & Access",
  technology: "Technology & Skills",
  qualification: "Qualification",
  emergencyContacts: "Emergency Contacts",
  documents: "Documents",
  review: "Review & Submit",
};

/**
 * draft -> pending_verification (on submit) -> verified (all required docs
 * VERIFIED) -> active (HR activates). inactive is a terminal state reachable
 * from active only. There is no "rejected" record status — rejection lives
 * at the individual document level so one rejected optional document never
 * blocks the rest of the record.
 */
export const ONBOARDING_STATUSES = [
  "draft",
  "pending_verification",
  "verified",
  "active",
  "inactive",
] as const;
export type OnboardingStatus = (typeof ONBOARDING_STATUSES)[number];

export const ONBOARDING_STATUS_LABELS: Record<OnboardingStatus, string> = {
  draft: "Draft",
  pending_verification: "Pending Verification",
  verified: "Verified",
  active: "Active",
  inactive: "Inactive",
};

export const DOCUMENT_STATUSES = ["PENDING", "VERIFIED", "REJECTED"] as const;
export type DocumentVerificationStatus = (typeof DOCUMENT_STATUSES)[number];

export interface BasicInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender | "";
  /**
   * Lives here, not in ContactInfo, because the backend's step 1 (Basic
   * Information) is what actually creates the User record — it needs a
   * unique email up front, before any later step exists to collect one.
   */
  email: string;
  profilePictureName?: string;
  profilePictureUrl?: string;
}

export interface ContactInfo {
  mobile: string;
  alternateMobile?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface ProfessionalInfo {
  department: string;
  designation: string;
  joiningDate: string;
  employmentType?: EmploymentType | "";
  reportingManager?: string;
  workLocation?: string;
  experience?: string;
  previousCompany?: string;
}

export interface RoleAccessInfo {
  /** A role name from the live Settings -> Role & Access list — not
   * constrained to this app's built-in Role union, since any role defined
   * there can be assigned during onboarding. */
  role: string;
}

export interface TechnologyInfo {
  technologies: string[];
}

export const QUALIFICATION_TYPES = [
  "10th",
  "12th",
  "Diploma",
  "Graduation",
  "Post Graduation",
  "Doctorate",
  "Other",
] as const;
export type QualificationType = (typeof QUALIFICATION_TYPES)[number];

export interface QualificationEntryDraft {
  id: string;
  type: QualificationType | "";
  institution: string;
  boardOrDegree: string;
  specialization?: string;
  startYear: string;
  endYear: string;
  percentageOrGrade?: string;
  certificateFileName?: string;
  /** Set once the certificate has actually been uploaded (see onboarding-asset.service.ts). */
  certificateUrl?: string;
}

export interface EmergencyContactDraft {
  id: string;
  name: string;
  relationship: string;
  mobile: string;
  email?: string;
  address?: string;
  isPrimary: boolean;
}

export const MAX_EMERGENCY_CONTACTS = 3;

/**
 * The onboarding wizard's document keys — matched 1:1 to both the fields a
 * GET progress/{userId} response actually returns and the Onboarding Assets
 * upload endpoint's `type` values. Aadhaar/PAN/education are required by
 * step 8's validation; experience certificate and address proof are tracked
 * by the backend too but never required.
 */
export interface DocumentRequirementConfig {
  key: "aadhaarCard" | "panCard" | "educationalCertificate" | "experienceCertificate" | "addressProof";
  name: string;
  required: boolean;
}

export const DEFAULT_DOCUMENT_CHECKLIST: DocumentRequirementConfig[] = [
  { key: "aadhaarCard", name: "Aadhaar Card", required: true },
  { key: "panCard", name: "PAN Card", required: true },
  { key: "educationalCertificate", name: "Educational Certificate", required: true },
  { key: "experienceCertificate", name: "Experience Certificate", required: false },
  { key: "addressProof", name: "Address Proof", required: false },
];

export interface OnboardingDocument {
  key: DocumentRequirementConfig["key"];
  name: string;
  required: boolean;
  fileName?: string;
  /** Set once the file has actually been uploaded (see onboarding-asset.service.ts). */
  fileUrl?: string;
  uploadedDate?: string;
  status: DocumentVerificationStatus;
  rejectionReason?: string;
}

export interface OnboardingRecord {
  id: string;
  status: OnboardingStatus;
  currentStepIndex: number;
  completedSteps: OnboardingStepKey[];
  employeeId?: string;
  basicInfo: BasicInfo;
  contactInfo: ContactInfo;
  professionalInfo: ProfessionalInfo;
  roleAccess: RoleAccessInfo;
  technology: TechnologyInfo;
  qualifications: QualificationEntryDraft[];
  emergencyContacts: EmergencyContactDraft[];
  documents: OnboardingDocument[];
  confirmedAccurate: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  verifiedAt?: string;
  activatedAt?: string;
}

export function createEmptyOnboardingRecord(params: { id: string; createdBy: string }): OnboardingRecord {
  const now = new Date().toISOString();
  return {
    id: params.id,
    status: "draft",
    currentStepIndex: 0,
    completedSteps: [],
    basicInfo: { firstName: "", lastName: "", dateOfBirth: "", gender: "", email: "" },
    contactInfo: { mobile: "" },
    professionalInfo: { department: "", designation: "", joiningDate: "" },
    roleAccess: { role: DEFAULT_ONBOARDING_ROLE },
    technology: { technologies: [] },
    qualifications: [],
    emergencyContacts: [],
    documents: DEFAULT_DOCUMENT_CHECKLIST.map((doc) => ({
      key: doc.key,
      name: doc.name,
      required: doc.required,
      status: "PENDING" as DocumentVerificationStatus,
    })).map((doc) => ({ ...doc, fileName: undefined, uploadedDate: undefined })),
    confirmedAccurate: false,
    createdBy: params.createdBy,
    createdAt: now,
    updatedAt: now,
  };
}

export function requiredDocuments(record: OnboardingRecord): OnboardingDocument[] {
  return record.documents.filter((doc) => doc.required);
}

export function allRequiredDocumentsVerified(record: OnboardingRecord): boolean {
  const required = requiredDocuments(record);
  return required.length > 0 && required.every((doc) => doc.status === "VERIFIED");
}

export function documentOverallStatus(record: OnboardingRecord): "Pending" | "Verified" | "Rejected" {
  if (record.documents.some((doc) => doc.status === "REJECTED")) return "Rejected";
  if (allRequiredDocumentsVerified(record)) return "Verified";
  return "Pending";
}

export function employeeFullName(basicInfo: BasicInfo): string {
  return [basicInfo.firstName, basicInfo.lastName].filter(Boolean).join(" ").trim();
}
