import { httpService } from "@/lib/http/http.service";
import { API_ENDPOINTS } from "@/lib/apiEndpoint";
import { ApiError } from "@/lib/http/interceptor";
import { toAbsoluteAssetUrl, fileNameFromPath } from "@/lib/asset-url";
import type { Gender, QualificationType } from "@/types/onboarding";
import { EMPLOYMENT_STATUSES, type EmploymentStatus } from "@/types/employee";
import type { MyProfile } from "@/types/profile";
import type { RolePermissionMap } from "@/types/rbac";

/**
 * Self-service profile — wired to the real HRMS backend's
 * GET /api/user/profile (see the "HRMS API" Postman collection, User >
 * Profile > Get My Profile). Works for any logged-in account, admin-tier
 * included; the collection notes it returns 404 (PROFILE_NOT_FOUND) for an
 * account that was never onboarded (no Employee record) — see
 * getMyProfile's caller in the profile page for how that's handled.
 */

interface RawQualification {
  _id?: string;
  type?: string;
  institution?: string;
  boardOrDegree?: string;
  specialization?: string | null;
  startYear?: number | string | null;
  endYear?: number | string | null;
  percentageOrGrade?: string | null;
  certificateUrl?: string | null;
}

interface RawEmergencyContact {
  _id?: string;
  name?: string;
  relationship?: string;
  mobile?: string;
  email?: string | null;
  address?: string | null;
  isPrimary?: boolean;
}

/** The full Role document, resolved from roleId. */
interface RawRole {
  id?: string;
  name?: string;
  label?: string;
  userType?: string;
  permissions?: Record<string, Record<string, boolean>>;
}

interface RawDocument {
  _id?: string;
  title?: string;
  category?: string;
  fileUrl?: string | null;
  fileSize?: number;
  mimeType?: string;
  verificationStatus?: string;
  createdAt?: string;
}

/** The real GET /api/user/profile body for an admin-tier account: flat, no
 * basicDetail/contactDetail/professionalDetail sections (those only exist
 * for onboarded employees). Distinguished by the response's top-level
 * `profileType: "admin"`. */
interface RawAdminProfile {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  roleId?: string;
  roleLabel?: string;
  userType?: string;
  permissions?: Record<string, Record<string, boolean>>;
  profileImage?: string | null;
  mobile?: string | null;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** The real GET /api/user/profile body: `{ success, profile: { ... } }`, grouped by section. */
interface RawProfile {
  userId?: string;
  employeeId?: string;
  basicDetail?: {
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
    dateOfBirth?: string | null;
    gender?: string | null;
    profilePicture?: string | null;
  };
  contactDetail?: {
    phone?: string | null;
    alternateMobile?: string | null;
    email?: string;
    address?: { city?: string; state?: string; pincode?: string; addressLine?: string } | null;
  };
  professionalDetail?: {
    designation?: string | null;
    department?: string | null;
    joiningDate?: string | null;
    employmentType?: string | null;
    workLocation?: string | null;
    experience?: string | null;
    previousCompany?: string | null;
    seniority?: string | null;
    status?: string | null;
    reportsTo?: string | null;
  };
  role?: RawRole | null;
  technicalSkill?: { skills?: string[] } | null;
  qualification?: RawQualification[] | null;
  emergencyContacts?: RawEmergencyContact[] | null;
  documents?: RawDocument[] | null;
  onboardingStatus?: string;
}

function isKnownStatus(value: string | undefined): value is EmploymentStatus {
  return Boolean(value) && (EMPLOYMENT_STATUSES as string[]).includes(value as string);
}

function mapProfile(raw: RawProfile): MyProfile {
  const basic = raw.basicDetail ?? {};
  const contact = raw.contactDetail ?? {};
  const pro = raw.professionalDetail ?? {};
  const role = raw.role ?? undefined;
  const status = pro.status?.toLowerCase();
  const address = contact.address;

  return {
    id: raw.userId ?? "",
    profileType: "employee",
    employeeId: raw.employeeId,
    firstName: basic.firstName,
    lastName: basic.lastName,
    name: basic.name || [basic.firstName, basic.lastName].filter(Boolean).join(" ").trim() || "—",
    email: basic.email ?? contact.email ?? "",
    phone: contact.phone ?? undefined,
    avatarUrl: basic.profilePicture ? toAbsoluteAssetUrl(basic.profilePicture) : undefined,
    designation: pro.designation ?? "",
    department: pro.department ?? "",
    location: pro.workLocation ?? undefined,
    employmentType: pro.employmentType ?? undefined,
    status: isKnownStatus(status) ? status : "active",
    role: role?.name,
    roleLabel: role?.label,
    userType: role?.userType,
    permissions: role?.permissions as RolePermissionMap | undefined,
    skills: raw.technicalSkill?.skills ?? [],
    joinedDate: pro.joiningDate ?? undefined,
    manager: pro.reportsTo ?? undefined,
    onboardingStatus: raw.onboardingStatus,
    dateOfBirth: basic.dateOfBirth ? basic.dateOfBirth.slice(0, 10) : undefined,
    gender: (basic.gender as Gender) || undefined,
    alternateMobile: contact.alternateMobile ?? undefined,
    address:
      address && (address.addressLine || address.city || address.state || address.pincode)
        ? { addressLine: address.addressLine, city: address.city, state: address.state, pincode: address.pincode }
        : undefined,
    previousCompany: pro.previousCompany ?? undefined,
    experience: pro.experience ?? undefined,
    qualifications: (raw.qualification ?? []).map((q, index) => ({
      id: q._id ?? `qual-${index}`,
      type: (q.type as QualificationType) ?? "",
      institution: q.institution ?? "",
      boardOrDegree: q.boardOrDegree ?? "",
      specialization: q.specialization || undefined,
      startYear: q.startYear != null ? String(q.startYear) : "",
      endYear: q.endYear != null ? String(q.endYear) : "",
      percentageOrGrade: q.percentageOrGrade || undefined,
      certificateUrl: q.certificateUrl ? toAbsoluteAssetUrl(q.certificateUrl) : undefined,
      certificateFileName: q.certificateUrl ? fileNameFromPath(q.certificateUrl) : undefined,
    })),
    emergencyContacts: (raw.emergencyContacts ?? []).map((c, index) => ({
      id: c._id ?? `ec-${index}`,
      name: c.name ?? "",
      relationship: c.relationship ?? "",
      mobile: c.mobile ?? "",
      email: c.email || undefined,
      address: c.address || undefined,
      isPrimary: Boolean(c.isPrimary),
    })),
    documents: (raw.documents ?? []).map((d, index) => ({
      id: d._id ?? `doc-${index}`,
      name: d.title ?? "Document",
      category: d.category,
      fileUrl: d.fileUrl ? toAbsoluteAssetUrl(d.fileUrl) : undefined,
      fileName: d.fileUrl ? fileNameFromPath(d.fileUrl) : undefined,
      verificationStatus: d.verificationStatus,
      sizeBytes: d.fileSize,
      mimeType: d.mimeType,
      uploadedOn: d.createdAt,
    })),
  };
}

function mapAdminProfile(raw: RawAdminProfile): MyProfile {
  return {
    id: raw.id ?? "",
    profileType: "admin",
    name: raw.name || "—",
    email: raw.email ?? "",
    phone: raw.mobile ?? undefined,
    avatarUrl: raw.profileImage ? toAbsoluteAssetUrl(raw.profileImage) : undefined,
    designation: "",
    department: "",
    status: "active",
    role: raw.role,
    roleLabel: raw.roleLabel,
    userType: raw.userType,
    skills: [],
    qualifications: [],
    emergencyContacts: [],
    documents: [],
    permissions: raw.permissions as RolePermissionMap | undefined,
  };
}

export class ProfileNotFoundError extends Error {}

type ProfileResponse = { profile?: RawProfile | RawAdminProfile; profileType?: string } & RawProfile;

function unwrapProfile(data: ProfileResponse): RawProfile {
  return (data.profile as RawProfile) ?? data;
}

function isAdminProfile(data: ProfileResponse): data is ProfileResponse & { profileType: "admin" } {
  return data.profileType === "admin";
}

function mapProfileResponse(data: ProfileResponse): MyProfile {
  if (isAdminProfile(data)) {
    return mapAdminProfile((data.profile ?? data) as RawAdminProfile);
  }
  return mapProfile(unwrapProfile(data));
}

export async function getMyProfile(): Promise<MyProfile> {
  try {
    return mapProfileResponse(await httpService.get<ProfileResponse>(API_ENDPOINTS.user.profile));
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      throw new ProfileNotFoundError(err.message);
    }
    throw err;
  }
}

/** Admin > Employees > Get Employee Profile (employees.view) — same shape as
 * Get My Profile, looked up by userId. */
export async function getEmployeeProfile(userId: string): Promise<MyProfile> {
  return mapProfileResponse(await httpService.get<ProfileResponse>(API_ENDPOINTS.admin.employeeProfile(userId)));
}

export interface UpdateBasicDetailPayload {
  name?: string;
  phone?: string;
  alternateMobile?: string;
  address?: { city?: string; state?: string; pincode?: string; addressLine?: string };
  skills?: string[];
  emergencyContacts?: { name: string; relationship: string; mobile: string; email?: string; isPrimary: boolean }[];
}

/** PATCH /api/user/profile, type: "basic_detail" — name/contact/skills/
 * emergencyContacts (full array replace, at most 3, exactly one isPrimary).
 * profileImage is set separately via uploadMyProfilePicture below. */
export async function updateMyProfile(payload: UpdateBasicDetailPayload): Promise<MyProfile> {
  const data = await httpService.patch<ProfileResponse>(API_ENDPOINTS.user.profile, { type: "basic_detail", ...payload });
  return mapProfile(unwrapProfile(data));
}

/** PATCH /api/admin/profile — admin-tier accounts only (super_admin/hr_admin/
 * manager/...), confirmed via Postman: multipart/form-data with `name`,
 * `mobile`, and an optional `file` field (the profile picture — this is also
 * the endpoint the Profile Picture tab uses for admin accounts, see
 * ProfilePictureTab). Distinct from updateMyProfile above, which is the
 * employee-shape "basic_detail" endpoint and doesn't apply here (no address/
 * skills/emergency contacts on an admin account). */
export async function updateAdminProfile(payload: { name?: string; mobile?: string; file?: File }): Promise<MyProfile> {
  const formData = new FormData();
  if (payload.name !== undefined) formData.append("name", payload.name);
  if (payload.mobile !== undefined) formData.append("mobile", payload.mobile);
  if (payload.file) formData.append("file", payload.file);
  const data = await httpService.patch<ProfileResponse>(API_ENDPOINTS.admin.profile, formData);
  return mapProfileResponse(data);
}

/** PATCH /api/user/profile, type: "qualification" — appends one qualification;
 * there's no separate list/edit/delete-by-id endpoint. */
export async function addQualification(qualification: {
  type: string;
  institution: string;
  boardOrDegree: string;
  specialization?: string;
  startYear: number;
  endYear: number;
  percentageOrGrade?: string;
}): Promise<MyProfile> {
  const data = await httpService.patch<ProfileResponse>(API_ENDPOINTS.user.profile, { type: "qualification", qualification });
  return mapProfile(unwrapProfile(data));
}

/** multipart/form-data, field "file" (jpeg/png/webp). Replaces any existing
 * picture — there's no separate remove-picture endpoint. */
export async function uploadMyProfilePicture(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const data = await httpService.post<{ url?: string; profileImage?: string; profile?: { basicDetail?: { profilePicture?: string } } }>(
    API_ENDPOINTS.user.profilePicture,
    formData
  );
  const url = data.url ?? data.profileImage ?? data.profile?.basicDetail?.profilePicture;
  if (!url) throw new Error("Server did not return the uploaded picture's URL.");
  return url;
}
