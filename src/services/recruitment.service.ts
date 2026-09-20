import { httpService } from "@/lib/http/http.service";
import { API_ENDPOINTS } from "@/lib/apiEndpoint";
import type {
  Candidate,
  Interview,
  InterviewStatus,
  JobPosting,
  JobStatus,
  JobType,
  PipelineStage,
  RecruitmentStats,
} from "@/types/recruitment";

/**
 * Recruitment — wired to the real HRMS backend's Admin > Recruitment API
 * (see the "HRMS API" Postman collection). Unlike every other module,
 * recruitment is NOT in SELF_SERVICE — no role gets any access here unless
 * explicitly granted (super_admin/hr_admin/recruiter, as FULL, by default).
 */

interface RawJobRef {
  id?: string;
  _id?: string;
  title?: string;
}

interface RawJob {
  id?: string;
  _id?: string;
  title?: string;
  department?: string;
  jobType?: string;
  location?: string;
  experienceRange?: string;
  openings?: number;
  status?: string;
  createdAt?: string;
}

interface RawCandidateRef {
  id?: string;
  _id?: string;
  name?: string;
}

interface RawCandidate {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  job?: RawJobRef | string | null;
  stage?: string;
  resumeUrl?: string;
  notes?: string;
  createdAt?: string;
}

interface RawInterview {
  id?: string;
  _id?: string;
  candidate?: RawCandidateRef | string | null;
  job?: RawJobRef | string | null;
  interviewer?: string;
  scheduledAt?: string;
  status?: string;
  notes?: string;
}

function normalizeJobStatus(value: string | undefined): JobStatus {
  const lower = value?.toLowerCase();
  if (lower === "on-hold" || lower === "on hold") return "On Hold";
  if (lower === "closed") return "Closed";
  return "Open";
}

function toApiJobStatus(status: JobStatus): string {
  return status === "On Hold" ? "On-Hold" : status;
}

function mapJob(raw: RawJob): JobPosting {
  return {
    id: raw.id ?? raw._id ?? "",
    title: raw.title ?? "",
    department: raw.department ?? "",
    location: raw.location ?? "",
    type: (raw.jobType as JobType) ?? "Full-time",
    status: normalizeJobStatus(raw.status),
    openings: raw.openings ?? 0,
    experience: raw.experienceRange ?? "",
    postedOn: raw.createdAt ?? "",
  };
}

function mapCandidate(raw: RawCandidate): Candidate {
  const job = typeof raw.job === "object" && raw.job ? raw.job : undefined;
  return {
    id: raw.id ?? raw._id ?? "",
    name: raw.name ?? "",
    email: raw.email ?? "",
    phone: raw.phone ?? "",
    jobId: job?.id ?? job?._id ?? (typeof raw.job === "string" ? raw.job : ""),
    jobTitle: job?.title ?? "—",
    stage: (raw.stage as PipelineStage) ?? "Applied",
    appliedOn: raw.createdAt ?? "",
    resumeUrl: raw.resumeUrl,
    notes: raw.notes,
  };
}

function normalizeInterviewStatus(value: string | undefined): InterviewStatus {
  const lower = value?.toLowerCase();
  if (lower === "completed") return "Completed";
  if (lower === "cancelled") return "Cancelled";
  return "Scheduled";
}

function mapInterview(raw: RawInterview): Interview {
  const candidate = typeof raw.candidate === "object" && raw.candidate ? raw.candidate : undefined;
  const job = typeof raw.job === "object" && raw.job ? raw.job : undefined;
  const scheduled = raw.scheduledAt ? new Date(raw.scheduledAt) : null;
  return {
    id: raw.id ?? raw._id ?? "",
    candidateId: candidate?.id ?? candidate?._id ?? (typeof raw.candidate === "string" ? raw.candidate : ""),
    candidateName: candidate?.name ?? "—",
    jobTitle: job?.title ?? "—",
    interviewer: raw.interviewer ?? "",
    date: scheduled ? scheduled.toISOString().slice(0, 10) : "",
    time: scheduled ? scheduled.toTimeString().slice(0, 5) : "",
    status: normalizeInterviewStatus(raw.status),
    notes: raw.notes,
  };
}

// This backend's list endpoints have been seen wrapping under the singular
// resource name (e.g. Admin > Leave's { "leave": [...] }) rather than the
// plural — every unwrap here checks both.
function unwrapJobs(data: { job?: RawJob[]; jobs?: RawJob[] } | RawJob[]): RawJob[] {
  return Array.isArray(data) ? data : (data.jobs ?? data.job ?? []);
}

function unwrapCandidates(data: { candidate?: RawCandidate[]; candidates?: RawCandidate[] } | RawCandidate[]): RawCandidate[] {
  return Array.isArray(data) ? data : (data.candidates ?? data.candidate ?? []);
}

function unwrapInterviews(data: { interview?: RawInterview[]; interviews?: RawInterview[] } | RawInterview[]): RawInterview[] {
  return Array.isArray(data) ? data : (data.interviews ?? data.interview ?? []);
}

/* -------------------------------- Stats ---------------------------------- */

export async function getRecruitmentStats(): Promise<RecruitmentStats> {
  const data = await httpService.get<Partial<RecruitmentStats>>(API_ENDPOINTS.admin.recruitmentStats);
  return {
    openPositions: data.openPositions ?? 0,
    totalCandidates: data.totalCandidates ?? 0,
    interviewsThisWeek: data.interviewsThisWeek ?? 0,
    offersExtended: data.offersExtended ?? 0,
  };
}

/* --------------------------------- Jobs ----------------------------------- */

export async function listJobs(filters: { department?: string; jobType?: JobType; status?: JobStatus } = {}): Promise<JobPosting[]> {
  const query: Record<string, string> = {};
  if (filters.department) query.department = filters.department;
  if (filters.jobType) query.jobType = filters.jobType;
  if (filters.status) query.status = toApiJobStatus(filters.status);
  const data = await httpService.get<Parameters<typeof unwrapJobs>[0]>(API_ENDPOINTS.admin.recruitmentJobs, query);
  return unwrapJobs(data).map(mapJob);
}

/** Always created with status "Open". */
export async function createJob(payload: {
  title: string;
  department: string;
  jobType: JobType;
  location: string;
  experienceRange: string;
  openings: number;
}): Promise<JobPosting> {
  const data = await httpService.post<{ job?: RawJob } | RawJob>(API_ENDPOINTS.admin.recruitmentJobs, payload);
  return mapJob("job" in data && data.job ? data.job : (data as RawJob));
}

export async function updateJobStatus(id: string, status: JobStatus): Promise<void> {
  await httpService.patch(API_ENDPOINTS.admin.recruitmentJobStatus(id), { status: toApiJobStatus(status) });
}

/** 400 JOB_IN_USE while it still has candidates in its pipeline. */
export async function deleteJob(id: string): Promise<void> {
  await httpService.delete(API_ENDPOINTS.admin.recruitmentJobById(id));
}

/* ------------------------------ Candidates -------------------------------- */

export async function listCandidates(filters: { job?: string; stage?: PipelineStage } = {}): Promise<Candidate[]> {
  const query: Record<string, string> = {};
  if (filters.job) query.job = filters.job;
  if (filters.stage) query.stage = filters.stage;
  const data = await httpService.get<Parameters<typeof unwrapCandidates>[0]>(API_ENDPOINTS.admin.recruitmentCandidates, query);
  return unwrapCandidates(data).map(mapCandidate);
}

/** Always created at stage "Applied". */
export async function addCandidate(payload: { name: string; email: string; phone: string; jobId: string }): Promise<Candidate> {
  const data = await httpService.post<{ candidate?: RawCandidate } | RawCandidate>(API_ENDPOINTS.admin.recruitmentCandidates, payload);
  return mapCandidate("candidate" in data && data.candidate ? data.candidate : (data as RawCandidate));
}

/** name/email/phone/resumeUrl/notes only — not stage, see moveCandidateStage. */
export async function updateCandidate(
  id: string,
  payload: Partial<{ name: string; email: string; phone: string; resumeUrl: string; notes: string }>
): Promise<void> {
  await httpService.patch(API_ENDPOINTS.admin.recruitmentCandidateById(id), payload);
}

/** Moving to "Hired" additionally requires recruitment.approve; to
 * "Rejected" additionally requires recruitment.reject — enforced server-side
 * on top of recruitment.edit. */
export async function moveCandidateStage(id: string, stage: PipelineStage): Promise<void> {
  await httpService.patch(API_ENDPOINTS.admin.recruitmentCandidateStage(id), { stage });
}

export async function deleteCandidate(id: string): Promise<void> {
  await httpService.delete(API_ENDPOINTS.admin.recruitmentCandidateById(id));
}

/* ------------------------------- Interviews -------------------------------- */

export async function listInterviews(filters: { candidateId?: string; jobId?: string; status?: InterviewStatus } = {}): Promise<Interview[]> {
  const query: Record<string, string> = {};
  if (filters.candidateId) query.candidateId = filters.candidateId;
  if (filters.jobId) query.jobId = filters.jobId;
  if (filters.status) query.status = filters.status;
  const data = await httpService.get<Parameters<typeof unwrapInterviews>[0]>(API_ENDPOINTS.admin.recruitmentInterviews, query);
  return unwrapInterviews(data).map(mapInterview);
}

/** job is denormalized from the candidate automatically. Always created
 * with status "Scheduled". */
export async function scheduleInterview(payload: { candidateId: string; scheduledAt: string; interviewer: string }): Promise<Interview> {
  const data = await httpService.post<{ interview?: RawInterview } | RawInterview>(API_ENDPOINTS.admin.recruitmentInterviews, payload);
  return mapInterview("interview" in data && data.interview ? data.interview : (data as RawInterview));
}

export async function updateInterviewStatus(id: string, status: InterviewStatus): Promise<void> {
  await httpService.patch(API_ENDPOINTS.admin.recruitmentInterviewStatus(id), { status });
}

export async function deleteInterview(id: string): Promise<void> {
  await httpService.delete(API_ENDPOINTS.admin.recruitmentInterviewById(id));
}

/* ------------------------------- Utilities --------------------------------- */

export function nextStage(stage: PipelineStage): PipelineStage | null {
  const order: PipelineStage[] = ["Applied", "Screening", "Interview", "Offer", "Hired"];
  const index = order.indexOf(stage);
  if (index === -1 || index === order.length - 1) return null;
  return order[index + 1];
}
