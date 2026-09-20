import { httpService } from "@/lib/http/http.service";
import { API_ENDPOINTS } from "@/lib/apiEndpoint";
import type { AttendanceStatus, TrainingAttendanceEntry, TrainingMode, TrainingProgram, TrainingStatus } from "@/types/training";

/**
 * Training — wired to the real HRMS backend's User > Training / Admin >
 * Training API (see the "HRMS API" Postman collection). List All Trainings
 * is gated on training.edit (admin-tier only by default), deliberately not
 * training.view (every role gets that for the self-service, role-scoped
 * List My Trainings below instead).
 */

export interface TrainingPayload {
  topic: string;
  role: string;
  mode: TrainingMode;
  trainer: string;
  date: string;
}

interface RawTraining {
  id?: string;
  _id?: string;
  topic?: string;
  role?: string;
  trainer?: string;
  mode?: string;
  date?: string;
  status?: string;
  cancellationReason?: string;
  enrolled?: number;
}

interface RawAttendanceEntry {
  employeeId?: string;
  name?: string;
  designation?: string;
  status?: string | null;
}

function normalizeStatus(value: string | undefined): TrainingStatus {
  const lower = value?.toLowerCase();
  if (lower === "completed") return "Completed";
  if (lower === "cancelled") return "Cancelled";
  return "Active";
}

function mapTraining(raw: RawTraining): TrainingProgram {
  return {
    id: raw.id ?? raw._id ?? "",
    topic: raw.topic ?? "",
    targetRole: raw.role ?? "",
    trainer: raw.trainer ?? "",
    mode: (raw.mode as TrainingMode) ?? "Online",
    date: raw.date ?? "",
    status: normalizeStatus(raw.status),
    cancellationReason: raw.cancellationReason,
    enrolled: raw.enrolled,
  };
}

// This backend's list endpoints have been seen wrapping under the singular
// resource name (e.g. Admin > Leave's { "leave": [...] }) rather than the
// plural — check both.
function unwrapTrainings(data: { training?: RawTraining[]; trainings?: RawTraining[] } | RawTraining[]): RawTraining[] {
  return Array.isArray(data) ? data : (data.trainings ?? (Array.isArray(data.training) ? data.training : []));
}

function unwrapOne(data: { training?: RawTraining } | RawTraining): RawTraining {
  return "training" in data && data.training ? data.training : (data as RawTraining);
}

/* -------------------------- User > Training ------------------------------ */

/** Self-service, role-scoped — only trainings whose role matches the
 * caller's own. */
export async function listMyTrainings(status?: TrainingStatus): Promise<TrainingProgram[]> {
  const data = await httpService.get<Parameters<typeof unwrapTrainings>[0]>(
    API_ENDPOINTS.user.trainings,
    status ? { status } : undefined
  );
  return unwrapTrainings(data).map(mapTraining);
}

/* -------------------------- Admin > Training ------------------------------ */

export async function listAllTrainings(
  filters: { role?: string; mode?: TrainingMode; status?: TrainingStatus } = {}
): Promise<TrainingProgram[]> {
  const query: Record<string, string> = {};
  if (filters.role) query.role = filters.role;
  if (filters.mode) query.mode = filters.mode;
  if (filters.status) query.status = filters.status;
  const data = await httpService.get<Parameters<typeof unwrapTrainings>[0]>(API_ENDPOINTS.admin.trainings, query);
  return unwrapTrainings(data).map(mapTraining);
}

export async function createTraining(payload: TrainingPayload): Promise<TrainingProgram> {
  const data = await httpService.post<{ training?: RawTraining } | RawTraining>(API_ENDPOINTS.admin.trainings, payload);
  return mapTraining(unwrapOne(data));
}

/** topic/role/mode/trainer/date only — status is changed via
 * updateTrainingStatus below. */
export async function updateTraining(id: string, payload: Partial<TrainingPayload>): Promise<TrainingProgram> {
  const data = await httpService.patch<{ training?: RawTraining } | RawTraining>(API_ENDPOINTS.admin.trainingById(id), payload);
  return mapTraining(unwrapOne(data));
}

/** cancellationReason is required when status is "Cancelled" (400
 * TRAINING_CANCELLATION_REASON_REQUIRED otherwise); moving off Cancelled
 * clears it again. */
export async function updateTrainingStatus(id: string, status: TrainingStatus, cancellationReason?: string): Promise<void> {
  await httpService.patch(API_ENDPOINTS.admin.trainingStatus(id), {
    status,
    ...(status === "Cancelled" ? { cancellationReason } : {}),
  });
}

export async function deleteTraining(id: string): Promise<void> {
  await httpService.delete(API_ENDPOINTS.admin.trainingById(id));
}

/** Every employee eligible for this training (role match), with their
 * attendance status (null = not marked yet). */
export async function getAttendanceRoster(trainingId: string): Promise<TrainingAttendanceEntry[]> {
  const data = await httpService.get<{ attendance?: RawAttendanceEntry[] } | RawAttendanceEntry[]>(
    API_ENDPOINTS.admin.trainingAttendance(trainingId)
  );
  const list = Array.isArray(data) ? data : (data.attendance ?? []);
  return list.map((raw) => ({
    employeeId: raw.employeeId ?? "",
    name: raw.name ?? "—",
    designation: raw.designation,
    status: raw.status === "Present" || raw.status === "Absent" ? raw.status : null,
  }));
}

/** Bulk Present/Absent for one or more eligible employees in a call. */
export async function markAttendance(
  trainingId: string,
  entries: { employeeId: string; status: AttendanceStatus }[]
): Promise<void> {
  await httpService.put(API_ENDPOINTS.admin.trainingAttendance(trainingId), { attendance: entries });
}
