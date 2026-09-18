import { httpService } from "@/lib/http/http.service";
import { ApiError } from "@/lib/http/interceptor";
import { toAbsoluteAssetUrl, fileNameFromPath } from "@/lib/asset-url";
import { DEFAULT_DOCUMENT_CHECKLIST, type Gender, type QualificationType } from "@/types/onboarding";
import { EMPLOYMENT_STATUSES, type EmploymentStatus } from "@/types/employee";
import type { MyProfile } from "@/types/profile";

/**
 * Self-service profile — wired to the real HRMS backend's
 * GET /api/user/profile (see the "HRMS API" Postman collection, User >
 * Profile > Get My Profile). Works for any logged-in account, admin-tier
 * included; the collection notes it returns 404 (PROFILE_NOT_FOUND) for an
 * account that was never onboarded (no Employee record) — see
 * getMyProfile's caller in the profile page for how that's handled.
 */

interface RawQualification {
  type?: string;
  institution?: string;
  boardOrDegree?: string;
  specialization?: string;
  startYear?: number | string;
  endYear?: number | string;
  percentageOrGrade?: string;
}

interface RawEmergencyContact {
  name?: string;
  relationship?: string;
  mobile?: string;
  email?: string;
  address?: string;
  isPrimary?: boolean;
}

interface RawProfile {
  userId?: string;
  id?: string;
  _id?: string;
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  profilePicture?: string;
  avatarUrl?: string;
  mobile?: string;
  phone?: string;
  alternateMobile?: string;
  city?: string;
  state?: string;
  pincode?: string;
  addressLine?: string;
  department?: string;
  designation?: string;
  joiningDate?: string;
  joinedDate?: string;
  employmentType?: string;
  workLocation?: string;
  location?: string;
  experience?: string;
  previousCompany?: string;
  reportsTo?: string;
  manager?: string;
  role?: string;
  status?: string;
  skills?: string[];
  qualifications?: RawQualification[];
  qualificationCertificates?: string[];
  emergencyContacts?: RawEmergencyContact[];
  aadhaarCard?: string;
  panCard?: string;
  educationalCertificate?: string;
  experienceCertificate?: string;
  addressProof?: string;
}

function isKnownStatus(value: string | undefined): value is EmploymentStatus {
  return Boolean(value) && (EMPLOYMENT_STATUSES as string[]).includes(value as string);
}

function mapProfile(raw: RawProfile): MyProfile {
  const id = raw.userId ?? raw.id ?? raw._id ?? "";
  const name = raw.name ?? [raw.firstName, raw.lastName].filter(Boolean).join(" ").trim();
  const status = raw.status?.toLowerCase();
  const certificates = raw.qualificationCertificates ?? [];

  const documentEntries = DEFAULT_DOCUMENT_CHECKLIST.map((doc) => {
    const value = raw[doc.key];
    return value
      ? { key: doc.key, name: doc.name, fileUrl: toAbsoluteAssetUrl(value), fileName: fileNameFromPath(value) }
      : { key: doc.key, name: doc.name };
  });

  return {
    id,
    employeeId: raw.employeeId,
    name: name || "—",
    email: raw.email ?? "",
    phone: raw.mobile ?? raw.phone,
    avatarUrl: raw.profilePicture ? toAbsoluteAssetUrl(raw.profilePicture) : raw.avatarUrl,
    designation: raw.designation ?? "",
    department: raw.department ?? "",
    location: raw.location ?? raw.workLocation,
    employmentType: raw.employmentType,
    status: isKnownStatus(status) ? status : "active",
    role: raw.role,
    skills: raw.skills ?? [],
    joinedDate: raw.joiningDate ?? raw.joinedDate,
    manager: raw.reportsTo ?? raw.manager,
    dateOfBirth: raw.dateOfBirth ? raw.dateOfBirth.slice(0, 10) : undefined,
    gender: (raw.gender as Gender) || undefined,
    alternateMobile: raw.alternateMobile,
    address:
      raw.addressLine || raw.city || raw.state || raw.pincode
        ? { addressLine: raw.addressLine, city: raw.city, state: raw.state, pincode: raw.pincode }
        : undefined,
    previousCompany: raw.previousCompany,
    experience: raw.experience,
    qualifications: (raw.qualifications ?? []).map((q, index) => ({
      id: `qual-${index}`,
      type: (q.type as QualificationType) ?? "",
      institution: q.institution ?? "",
      boardOrDegree: q.boardOrDegree ?? "",
      specialization: q.specialization ?? undefined,
      startYear: q.startYear != null ? String(q.startYear) : "",
      endYear: q.endYear != null ? String(q.endYear) : "",
      percentageOrGrade: q.percentageOrGrade ?? undefined,
      certificateUrl: certificates[index] ? toAbsoluteAssetUrl(certificates[index]) : undefined,
      certificateFileName: certificates[index] ? fileNameFromPath(certificates[index]) : undefined,
    })),
    emergencyContacts: (raw.emergencyContacts ?? []).map((c, index) => ({
      id: `ec-${index}`,
      name: c.name ?? "",
      relationship: c.relationship ?? "",
      mobile: c.mobile ?? "",
      email: c.email || undefined,
      address: c.address || undefined,
      isPrimary: Boolean(c.isPrimary),
    })),
    documents: documentEntries,
  };
}

export class ProfileNotFoundError extends Error {}

export async function getMyProfile(): Promise<MyProfile> {
  try {
    const data = await httpService.get<{ data?: RawProfile; profile?: RawProfile } | RawProfile>("/api/user/profile");
    const raw = "data" in data && data.data ? data.data : "profile" in data && data.profile ? data.profile : (data as RawProfile);
    return mapProfile(raw);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      throw new ProfileNotFoundError(err.message);
    }
    throw err;
  }
}
