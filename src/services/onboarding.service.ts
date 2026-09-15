import { httpService } from "@/lib/http/http.service";
import { API_BASE_URL } from "@/lib/http/interceptor";
import { listRoles } from "@/services/role.service";
import { MOCK_EMPLOYEES } from "@/services/employee.service";
import {
  allRequiredDocumentsVerified,
  createEmptyOnboardingRecord,
  employeeFullName,
  requiredDocuments,
  ONBOARDING_STEP_KEYS,
  DEFAULT_ONBOARDING_ROLE,
  type DocumentRequirementConfig,
  type EmergencyContactDraft,
  type EmploymentType,
  type Gender,
  type OnboardingRecord,
  type OnboardingStepKey,
  type QualificationEntryDraft,
  type QualificationType,
} from "@/types/onboarding";

/**
 * Onboarding service — split between two backends:
 *
 * - The wizard's create/save/resume/discard/list-pending flow (everything
 *   below the "REAL API" marker) is wired to the real HRMS backend's
 *   Admin > Onboarding (Step by Step) API (see the "HRMS API" Postman
 *   collection). Every record it creates carries a real backend `userId` as
 *   its `id`.
 * - HR document verification and activate/deactivate (below the "MOCK"
 *   marker) have no equivalent endpoint in that collection at all — it only
 *   knows "in progress" vs "completed" (step 9). Those stay on the original
 *   localStorage mock, scoped to legacy records whose id is prefixed
 *   "onb-" (never a real backend id), so the two systems never collide.
 */

const STORAGE_KEY = "hrms-onboarding-records";
const EMPLOYEE_ID_PREFIX = "HK-";
const EMPLOYEE_ID_START = 1111;

function isLegacyId(id: string): boolean {
  return id.startsWith("onb-");
}

function delay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readStore(): OnboardingRecord[] {
  if (typeof localStorage === "undefined") return seedRecords();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedRecords();
      writeStore(seeded);
      return seeded;
    }
    return JSON.parse(raw) as OnboardingRecord[];
  } catch {
    return seedRecords();
  }
}

function writeStore(records: OnboardingRecord[]) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function seedRecords(): OnboardingRecord[] {
  // No demo data — legacy ("onb-"-prefixed) records only ever come from
  // whatever gets saved into this store at runtime.
  return [];
}

export interface EmailCheckResult {
  exists: boolean;
  conflict: boolean;
}

/**
 * Soft, client-side-only check — this collection has no "does this email
 * exist" endpoint. The real, authoritative check happens when step 1 is
 * submitted; the backend rejects a duplicate email there. This just gives
 * faster feedback for the obvious cases (an existing employee, or another
 * legacy demo record).
 */
export async function checkEmailExists(email: string, excludeRecordId?: string): Promise<EmailCheckResult> {
  await delay(200);
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { exists: false, conflict: false };

  const matchesEmployee = MOCK_EMPLOYEES.some((employee) => employee.email.toLowerCase() === normalized);
  const matchesLegacy = readStore().some(
    (record) => record.id !== excludeRecordId && record.basicInfo.email.toLowerCase() === normalized
  );

  const exists = matchesEmployee || matchesLegacy;
  return { exists, conflict: exists };
}

/* ------------------------------------------------------------------------ *
 * REAL API — the onboarding wizard (create, save each step, resume, list
 * pending, discard, complete).
 * ------------------------------------------------------------------------ */

interface OnboardStepResponse {
  userId?: string;
  message?: string;
}

async function resolveRoleId(roleName: string): Promise<string> {
  const roles = await listRoles();
  const matched = roles.find((role) => role.name === roleName);
  if (!matched) {
    throw new Error(`The "${roleName}" role isn't set up in Settings > Role & Access yet.`);
  }
  return matched.id;
}

/**
 * Saves one wizard step to the real backend. `basicInfo` is special: with no
 * `record.id` yet it CREATES the User + Employee and the returned `userId`
 * becomes this record's id from then on; with an id already set, it instead
 * updates that same record's basic info (the collection notes step 1 can be
 * re-run with a userId to edit it). Every other step just PATCHes by that id.
 */
async function saveOnboardingStepRemote(record: OnboardingRecord, stepKey: OnboardingStepKey): Promise<OnboardingRecord> {
  switch (stepKey) {
    case "basicInfo": {
      const payload: Record<string, unknown> = {
        firstName: record.basicInfo.firstName,
        lastName: record.basicInfo.lastName,
        dateOfBirth: record.basicInfo.dateOfBirth,
        gender: record.basicInfo.gender,
        email: record.basicInfo.email,
        profilePicture: record.basicInfo.profilePictureUrl,
      };
      if (record.id) payload.userId = record.id;

      const data = await httpService.post<OnboardStepResponse>("/api/admin/employees/onboard/step/1", payload);
      const userId = record.id || data.userId;
      if (!userId) throw new Error("Server did not return a user id for this onboarding record.");
      return { ...record, id: userId };
    }
    case "contactInfo": {
      await httpService.post("/api/admin/employees/onboard/step/2", {
        userId: record.id,
        mobile: record.contactInfo.mobile,
        alternateMobile: record.contactInfo.alternateMobile ?? "",
        city: record.contactInfo.city ?? "",
        state: record.contactInfo.state ?? "",
        pincode: record.contactInfo.pincode ?? "",
        addressLine: record.contactInfo.address ?? "",
      });
      return record;
    }
    case "professionalInfo": {
      await httpService.post("/api/admin/employees/onboard/step/3", {
        userId: record.id,
        department: record.professionalInfo.department,
        designation: record.professionalInfo.designation,
        joiningDate: record.professionalInfo.joiningDate,
        employmentType: record.professionalInfo.employmentType || undefined,
        workLocation: record.professionalInfo.workLocation,
        experience: record.professionalInfo.experience,
        previousCompany: record.professionalInfo.previousCompany,
        // reportingManager has no field in this API version yet — kept in
        // local state only so the UI doesn't lose it if the backend grows one.
      });
      return record;
    }
    case "roleAccess": {
      const roleId = await resolveRoleId(record.roleAccess.role);
      await httpService.post("/api/admin/employees/onboard/step/4", { userId: record.id, roleId });
      return record;
    }
    case "technology": {
      await httpService.post("/api/admin/employees/onboard/step/5", {
        userId: record.id,
        skills: record.technology.technologies,
      });
      return record;
    }
    case "qualification": {
      const qualificationCertificates = record.qualifications
        .map((q) => q.certificateUrl)
        .filter((url): url is string => Boolean(url));
      await httpService.post("/api/admin/employees/onboard/step/6", {
        userId: record.id,
        qualifications: record.qualifications.map((q) => ({
          type: q.type,
          institution: q.institution,
          boardOrDegree: q.boardOrDegree,
          specialization: q.specialization,
          startYear: Number(q.startYear),
          endYear: Number(q.endYear),
          percentageOrGrade: q.percentageOrGrade,
        })),
        qualificationCertificates,
      });
      return record;
    }
    case "emergencyContacts": {
      await httpService.post("/api/admin/employees/onboard/step/7", {
        userId: record.id,
        emergencyContacts: record.emergencyContacts.map((contact) => ({
          name: contact.name,
          relationship: contact.relationship,
          mobile: contact.mobile,
          email: contact.email ?? "",
          address: contact.address ?? "",
          isPrimary: contact.isPrimary,
        })),
      });
      return record;
    }
    case "documents": {
      const urlFor = (key: DocumentRequirementConfig["key"]) => record.documents.find((doc) => doc.key === key)?.fileUrl ?? "";
      await httpService.post("/api/admin/employees/onboard/step/8", {
        userId: record.id,
        aadhaarCard: urlFor("aadhaarCard"),
        panCard: urlFor("panCard"),
        educationalCertificate: urlFor("educationalCertificate"),
        experienceCertificate: urlFor("experienceCertificate"),
        addressProof: urlFor("addressProof"),
      });
      return record;
    }
    case "review":
      // Nothing of its own to persist — completeOnboardingRemote (below)
      // handles step 9 as a separate call once the user confirms and submits.
      return record;
  }
}

async function completeOnboardingRemote(record: OnboardingRecord): Promise<OnboardingRecord> {
  await httpService.post("/api/admin/employees/onboard/step/9", { userId: record.id });
  return { ...record, status: "pending_verification", submittedAt: new Date().toISOString() };
}

interface OnboardProgressQualification {
  type?: string;
  institution?: string;
  boardOrDegree?: string;
  specialization?: string;
  startYear?: number;
  endYear?: number;
  percentageOrGrade?: string;
}

interface OnboardProgressEmergencyContact {
  name?: string;
  relationship?: string;
  mobile?: string;
  email?: string;
  address?: string;
  isPrimary?: boolean;
}

/** The flat `data` object a GET progress/{userId} response carries — every
 * step's fields merged together, unset ones coming back `null`. */
interface OnboardProgressData {
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  email?: string | null;
  profilePicture?: string | null;
  mobile?: string | null;
  alternateMobile?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  addressLine?: string | null;
  department?: string | null;
  designation?: string | null;
  joiningDate?: string | null;
  employmentType?: string | null;
  workLocation?: string | null;
  experience?: string | null;
  previousCompany?: string | null;
  reportsTo?: string | null;
  role?: string | null;
  roleId?: string | null;
  skills?: string[] | null;
  qualifications?: OnboardProgressQualification[] | null;
  qualificationCertificates?: string[] | null;
  emergencyContacts?: OnboardProgressEmergencyContact[] | null;
  aadhaarCard?: string | null;
  panCard?: string | null;
  educationalCertificate?: string | null;
  experienceCertificate?: string | null;
  addressProof?: string | null;
}

interface OnboardProgressResponse {
  userId?: string;
  employeeId?: string;
  currentStep?: number;
  completedSteps?: number[];
  status?: string;
  data?: OnboardProgressData;
  createdAt?: string;
  updatedAt?: string;
}

/** Uploaded files come back as backend-relative paths (e.g.
 * "/uploads/profile-pictures/...jpg") — resolve against the API host to get
 * something a browser can actually load. */
function toAbsoluteAssetUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${API_BASE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

function fileNameFromPath(pathOrUrl: string): string {
  return pathOrUrl.split("/").pop() || pathOrUrl;
}

/** Maps a GET progress/{userId} (or one entry of GET progress) response into
 * this app's OnboardingRecord shape, repopulating every step's fields —
 * not just the current one — so resuming shows previously entered data
 * throughout the wizard, not a blank form on every step already saved. */
function mapProgressToRecord(response: OnboardProgressResponse, createdBy: string): OnboardingRecord {
  const id = response.userId ?? "";
  const record = createEmptyOnboardingRecord({ id, createdBy });
  const d = response.data ?? {};

  record.employeeId = response.employeeId || undefined;

  record.basicInfo = {
    firstName: d.firstName ?? "",
    lastName: d.lastName ?? "",
    dateOfBirth: d.dateOfBirth ? d.dateOfBirth.slice(0, 10) : "",
    gender: (d.gender as Gender) ?? "",
    email: d.email ?? "",
    profilePictureUrl: d.profilePicture ? toAbsoluteAssetUrl(d.profilePicture) : undefined,
    profilePictureName: d.profilePicture ? fileNameFromPath(d.profilePicture) : undefined,
  };

  record.contactInfo = {
    mobile: d.mobile ?? "",
    alternateMobile: d.alternateMobile ?? undefined,
    city: d.city ?? undefined,
    state: d.state ?? undefined,
    pincode: d.pincode ?? undefined,
    address: d.addressLine ?? undefined,
  };

  record.professionalInfo = {
    department: d.department ?? "",
    designation: d.designation ?? "",
    joiningDate: d.joiningDate ? d.joiningDate.slice(0, 10) : "",
    employmentType: (d.employmentType as EmploymentType) ?? "",
    workLocation: d.workLocation ?? undefined,
    experience: d.experience ?? undefined,
    previousCompany: d.previousCompany ?? undefined,
    reportingManager: d.reportsTo ?? undefined,
  };

  record.roleAccess = { role: d.role || DEFAULT_ONBOARDING_ROLE };

  record.technology = { technologies: d.skills ?? [] };

  const certificates = d.qualificationCertificates ?? [];
  record.qualifications = (d.qualifications ?? []).map(
    (q, index): QualificationEntryDraft => ({
      id: `qual-${index}`,
      type: (q.type as QualificationType) ?? "",
      institution: q.institution ?? "",
      boardOrDegree: q.boardOrDegree ?? "",
      specialization: q.specialization ?? undefined,
      startYear: q.startYear != null ? String(q.startYear) : "",
      endYear: q.endYear != null ? String(q.endYear) : "",
      percentageOrGrade: q.percentageOrGrade ?? undefined,
      // Certificates come back as one flat array for the whole step, not
      // per-entry — this assumes the backend preserves the order they were
      // submitted in (the same order this app sends them).
      certificateUrl: certificates[index] ? toAbsoluteAssetUrl(certificates[index]) : undefined,
      certificateFileName: certificates[index] ? fileNameFromPath(certificates[index]) : undefined,
    })
  );

  record.emergencyContacts = (d.emergencyContacts ?? []).map(
    (c, index): EmergencyContactDraft => ({
      id: `ec-${index}`,
      name: c.name ?? "",
      relationship: c.relationship ?? "",
      mobile: c.mobile ?? "",
      email: c.email || undefined,
      address: c.address || undefined,
      isPrimary: Boolean(c.isPrimary),
    })
  );

  record.documents = record.documents.map((doc) => {
    const value = d[doc.key];
    if (!value) return doc;
    return {
      ...doc,
      fileUrl: toAbsoluteAssetUrl(value),
      fileName: fileNameFromPath(value),
      uploadedDate: response.updatedAt?.slice(0, 10),
    };
  });

  const completedStepNumbers = response.completedSteps ?? [];
  record.completedSteps = completedStepNumbers
    .map((stepNumber) => ONBOARDING_STEP_KEYS[stepNumber - 1])
    .filter((key): key is OnboardingStepKey => Boolean(key));

  const currentStep = response.currentStep ?? 1;
  record.currentStepIndex = Math.min(Math.max(currentStep - 1, 0), ONBOARDING_STEP_KEYS.length - 1);
  // The real backend only has two states (in_progress / completed); a
  // "completed" record drops out of the progress endpoints entirely per the
  // collection, so anything reaching this mapper is still in progress —
  // "draft" is this app's local status for "render the wizard, resumable".
  record.status = "draft";
  if (response.createdAt) record.createdAt = response.createdAt;
  if (response.updatedAt) record.updatedAt = response.updatedAt;

  return record;
}

async function getOnboardingRemoteById(userId: string, createdBy: string): Promise<OnboardingRecord | undefined> {
  try {
    const data = await httpService.get<OnboardProgressResponse>(`/api/admin/employees/onboard/progress/${userId}`);
    return mapProgressToRecord(data, createdBy);
  } catch {
    return undefined;
  }
}

async function listOnboardingRemote(createdBy: string): Promise<OnboardingRecord[]> {
  try {
    const data = await httpService.get<{ records?: OnboardProgressResponse[] } | OnboardProgressResponse[]>(
      "/api/admin/employees/onboard/progress"
    );
    const entries = Array.isArray(data) ? data : (data.records ?? []);
    return entries.map((entry) => mapProgressToRecord(entry, createdBy));
  } catch {
    return [];
  }
}

export async function discardOnboarding(userId: string): Promise<void> {
  await httpService.delete(`/api/admin/employees/onboard/progress/${userId}`);
}

/* ------------------------------------------------------------------------ *
 * MOCK — HR document verification / activation, unchanged. Scoped to legacy
 * ("onb-"-prefixed) records only; see the module comment above.
 * ------------------------------------------------------------------------ */

export async function getOnboardingRecords(): Promise<OnboardingRecord[]> {
  return listOnboardingRemote("HR Team");
}

export function getOnboardingByIdSync(id: string): OnboardingRecord | undefined {
  return readStore().find((record) => record.id === id);
}

export async function getOnboardingById(id: string): Promise<OnboardingRecord | undefined> {
  if (isLegacyId(id)) {
    await delay(200);
    return getOnboardingByIdSync(id);
  }
  return getOnboardingRemoteById(id, "HR Team");
}

export function createDraftOnboarding(createdBy: string): OnboardingRecord {
  // No backend record exists yet — nothing to create server-side until Basic
  // Information (which now includes email) is submitted. Returns a purely
  // local, id-less scaffold; saveOnboardingRecord's "basicInfo" case is what
  // actually creates the record on first save.
  return createEmptyOnboardingRecord({ id: "", createdBy });
}

/**
 * Persists one wizard step. Routes to the real backend for a new or
 * real-backend record; legacy demo records (id prefixed "onb-") keep the
 * original localStorage upsert-the-whole-record behavior so the HR
 * verification/activation screens are unaffected.
 */
export async function saveOnboardingRecord(record: OnboardingRecord, stepKey: OnboardingStepKey): Promise<OnboardingRecord> {
  if (record.id && isLegacyId(record.id)) {
    await delay(300);
    const records = readStore();
    const next = { ...record, updatedAt: new Date().toISOString() };
    const index = records.findIndex((item) => item.id === record.id);
    if (index === -1) records.unshift(next);
    else records[index] = next;
    writeStore(records);
    return next;
  }

  const saved = await saveOnboardingStepRemote(record, stepKey);
  return { ...saved, updatedAt: new Date().toISOString() };
}

export async function submitOnboarding(record: OnboardingRecord): Promise<OnboardingRecord> {
  if (record.id && isLegacyId(record.id)) {
    await delay(400);
    const records = readStore();
    const stored = records.find((item) => item.id === record.id);
    if (!stored) throw new Error("Onboarding record not found.");
    stored.status = "pending_verification";
    stored.submittedAt = new Date().toISOString();
    stored.updatedAt = new Date().toISOString();
    writeStore(records);
    return stored;
  }

  return completeOnboardingRemote(record);
}

function recomputeReadiness(record: OnboardingRecord) {
  if (record.status !== "pending_verification" && record.status !== "verified") return;
  record.status = allRequiredDocumentsVerified(record) ? "verified" : "pending_verification";
  if (record.status === "verified" && !record.verifiedAt) {
    record.verifiedAt = new Date().toISOString();
  }
}

export async function verifyDocument(recordId: string, docKey: string): Promise<OnboardingRecord> {
  await delay(300);
  const records = readStore();
  const record = records.find((item) => item.id === recordId);
  if (!record) throw new Error("Onboarding record not found.");

  record.documents = record.documents.map((doc) =>
    doc.key === docKey ? { ...doc, status: "VERIFIED", rejectionReason: undefined } : doc
  );
  recomputeReadiness(record);
  record.updatedAt = new Date().toISOString();
  writeStore(records);
  return record;
}

export async function rejectDocument(recordId: string, docKey: string, reason: string): Promise<OnboardingRecord> {
  await delay(300);
  const records = readStore();
  const record = records.find((item) => item.id === recordId);
  if (!record) throw new Error("Onboarding record not found.");

  record.documents = record.documents.map((doc) =>
    doc.key === docKey ? { ...doc, status: "REJECTED", rejectionReason: reason } : doc
  );
  recomputeReadiness(record);
  record.updatedAt = new Date().toISOString();
  writeStore(records);
  return record;
}

export async function reuploadDocument(recordId: string, docKey: string, fileName: string): Promise<OnboardingRecord> {
  await delay(300);
  const records = readStore();
  const record = records.find((item) => item.id === recordId);
  if (!record) throw new Error("Onboarding record not found.");

  record.documents = record.documents.map((doc) =>
    doc.key === docKey
      ? { ...doc, fileName, uploadedDate: new Date().toISOString().slice(0, 10), status: "PENDING", rejectionReason: undefined }
      : doc
  );
  recomputeReadiness(record);
  record.updatedAt = new Date().toISOString();
  writeStore(records);
  return record;
}

function generateEmployeeId(records: OnboardingRecord[]): string {
  const usedNumbers = records
    .map((record) => record.employeeId)
    .filter((value): value is string => Boolean(value))
    .map((value) => Number(value.replace(EMPLOYEE_ID_PREFIX, "")))
    .filter((value) => !Number.isNaN(value));

  const next = usedNumbers.length > 0 ? Math.max(...usedNumbers) + 1 : EMPLOYEE_ID_START;
  return `${EMPLOYEE_ID_PREFIX}${next}`;
}

export async function activateEmployee(recordId: string): Promise<OnboardingRecord> {
  await delay(500);
  const records = readStore();
  const record = records.find((item) => item.id === recordId);
  if (!record) throw new Error("Onboarding record not found.");
  if (record.status !== "verified") {
    throw new Error("All required documents must be verified before activation.");
  }

  if (!record.employeeId) {
    record.employeeId = generateEmployeeId(records);
  }
  record.status = "active";
  record.activatedAt = new Date().toISOString();
  record.updatedAt = new Date().toISOString();
  writeStore(records);
  return record;
}

export async function deactivateEmployee(recordId: string): Promise<OnboardingRecord> {
  await delay(300);
  const records = readStore();
  const record = records.find((item) => item.id === recordId);
  if (!record) throw new Error("Onboarding record not found.");

  record.status = "inactive";
  record.updatedAt = new Date().toISOString();
  writeStore(records);
  return record;
}

export function onboardingDisplayName(record: OnboardingRecord): string {
  return employeeFullName(record.basicInfo) || "Unnamed Candidate";
}

export function pendingRequiredDocumentCount(record: OnboardingRecord): number {
  return requiredDocuments(record).filter((doc) => doc.status !== "VERIFIED").length;
}
