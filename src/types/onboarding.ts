import type { Role } from "./user";

export const GENDERS = ["Male", "Female", "Other", "Prefer not to say"] as const;
export type Gender = (typeof GENDERS)[number];

export const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Intern"] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

/**
 * Roles assignable during onboarding. A subset of the app-wide Role union —
 * "special_employee" is an internal designation, not something HR picks
 * while bringing a new hire on board.
 */
export const ONBOARDING_ROLES: Role[] = [
  "super_admin",
  "hr_admin",
  "hr_executive",
  "manager",
  "recruiter",
  "payroll_admin",
  "employee",
];

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
  profilePictureName?: string;
  profilePictureUrl?: string;
}

export interface ContactInfo {
  email: string;
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
  role: Role;
}

export interface TechnologyInfo {
  technologies: string[];
}

export interface QualificationEntryDraft {
  id: string;
  qualification: string;
  institution: string;
  specialization?: string;
  passingYear: string;
  grade?: string;
  certificateFileName?: string;
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

export interface DocumentRequirementConfig {
  key: string;
  name: string;
  required: boolean;
}

/**
 * Configurable checklist of documents HR expects during onboarding. Swap
 * this for a backend-driven list once one exists — nothing else in the
 * module assumes a fixed set of keys.
 */
export const DEFAULT_DOCUMENT_CHECKLIST: DocumentRequirementConfig[] = [
  { key: "aadhaar", name: "Aadhaar Card", required: true },
  { key: "pan", name: "PAN Card", required: true },
  { key: "educationCertificate", name: "Educational Certificate", required: true },
  { key: "experienceCertificate", name: "Experience Certificate", required: false },
  { key: "addressProof", name: "Address Proof", required: false },
];

export interface OnboardingDocument {
  key: string;
  name: string;
  required: boolean;
  fileName?: string;
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
    basicInfo: { firstName: "", lastName: "", dateOfBirth: "", gender: "" },
    contactInfo: { email: "", mobile: "" },
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
