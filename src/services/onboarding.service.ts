import { MOCK_EMPLOYEES } from "@/services/employee.service";
import {
  allRequiredDocumentsVerified,
  createEmptyOnboardingRecord,
  employeeFullName,
  requiredDocuments,
  type OnboardingRecord,
} from "@/types/onboarding";

/**
 * Mock onboarding service. Records live in localStorage so a draft survives
 * a refresh — swap every function body here for a real API call once the
 * Node.js backend exists; callers only depend on these signatures.
 */

const STORAGE_KEY = "hrms-onboarding-records";
const EMPLOYEE_ID_PREFIX = "HK-";
const EMPLOYEE_ID_START = 1111;

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
  const draft = createEmptyOnboardingRecord({ id: "onb-seed-draft", createdBy: "Riya Kapoor" });
  draft.basicInfo = { firstName: "Ishita", lastName: "Verma", dateOfBirth: "1998-04-12", gender: "Female" };
  draft.contactInfo = { email: "ishita.verma@hikeassociate.com", mobile: "+91 98200 11223", city: "Delhi", state: "Delhi" };
  draft.professionalInfo = { department: "Engineering", designation: "Frontend Engineer", joiningDate: "2026-09-20", employmentType: "Full-time" };
  draft.currentStepIndex = 2;
  draft.completedSteps = ["basicInfo", "contactInfo"];

  const pending = createEmptyOnboardingRecord({ id: "onb-seed-pending", createdBy: "Ananya Iyer" });
  pending.basicInfo = { firstName: "Rohit", lastName: "Bhatia", dateOfBirth: "1996-11-02", gender: "Male" };
  pending.contactInfo = { email: "rohit.bhatia@hikeassociate.com", mobile: "+91 98300 44556", city: "Bangalore", state: "Karnataka" };
  pending.professionalInfo = { department: "Engineering", designation: "Backend Engineer", joiningDate: "2026-09-01", employmentType: "Full-time" };
  pending.roleAccess = { role: "employee" };
  pending.technology = { technologies: ["Java", "AWS"] };
  pending.qualifications = [
    { id: "q1", qualification: "Graduation", institution: "NIT Trichy", specialization: "Computer Science", passingYear: "2018", grade: "8.4 CGPA" },
  ];
  pending.emergencyContacts = [
    { id: "e1", name: "Sunita Bhatia", relationship: "Mother", mobile: "+91 98700 12345", isPrimary: true },
  ];
  pending.documents = pending.documents.map((doc) =>
    doc.key === "aadhaar" || doc.key === "pan"
      ? { ...doc, fileName: `${doc.name.replace(/\s+/g, "_")}.pdf`, uploadedDate: "2026-08-28", status: "PENDING" }
      : doc
  );
  pending.confirmedAccurate = true;
  pending.status = "pending_verification";
  pending.currentStepIndex = 8;
  pending.completedSteps = ["basicInfo", "contactInfo", "professionalInfo", "roleAccess", "technology", "qualification", "emergencyContacts", "documents", "review"];
  pending.submittedAt = new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString();

  return [draft, pending];
}

export async function getOnboardingRecords(): Promise<OnboardingRecord[]> {
  await delay(250);
  return readStore();
}

export function getOnboardingByIdSync(id: string): OnboardingRecord | undefined {
  return readStore().find((record) => record.id === id);
}

export async function getOnboardingById(id: string): Promise<OnboardingRecord | undefined> {
  await delay(200);
  return getOnboardingByIdSync(id);
}

export function createDraftOnboarding(createdBy: string): OnboardingRecord {
  const id = `onb-${Date.now()}`;
  const record = createEmptyOnboardingRecord({ id, createdBy });
  const records = readStore();
  records.unshift(record);
  writeStore(records);
  return record;
}

export async function saveOnboardingRecord(record: OnboardingRecord): Promise<OnboardingRecord> {
  await delay(300);
  const records = readStore();
  const next = { ...record, updatedAt: new Date().toISOString() };
  const index = records.findIndex((item) => item.id === record.id);
  if (index === -1) records.unshift(next);
  else records[index] = next;
  writeStore(records);
  return next;
}

export interface EmailCheckResult {
  exists: boolean;
  /** true when the match belongs to a different, unrelated onboarding record or an active employee — never auto-resolved. */
  conflict: boolean;
}

export async function checkEmailExists(email: string, excludeRecordId?: string): Promise<EmailCheckResult> {
  await delay(350);
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { exists: false, conflict: false };

  const matchesEmployee = MOCK_EMPLOYEES.some((employee) => employee.email.toLowerCase() === normalized);
  const matchesOnboarding = readStore().some(
    (record) => record.id !== excludeRecordId && record.contactInfo.email.toLowerCase() === normalized
  );

  const exists = matchesEmployee || matchesOnboarding;
  return { exists, conflict: exists };
}

export async function submitOnboarding(id: string): Promise<OnboardingRecord> {
  await delay(400);
  const records = readStore();
  const record = records.find((item) => item.id === id);
  if (!record) throw new Error("Onboarding record not found.");

  record.status = "pending_verification";
  record.submittedAt = new Date().toISOString();
  record.updatedAt = new Date().toISOString();
  writeStore(records);
  return record;
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
