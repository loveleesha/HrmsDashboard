export type JobStatus = "Open" | "On Hold" | "Closed";
export type JobType = "Full-time" | "Part-time" | "Contract" | "Internship";
export type PipelineStage = "Applied" | "Screening" | "Interview" | "Offer" | "Hired" | "Rejected";

export const PIPELINE_STAGES: PipelineStage[] = [
  "Applied",
  "Screening",
  "Interview",
  "Offer",
  "Hired",
  "Rejected",
];

export const JOB_TYPES: JobType[] = ["Full-time", "Part-time", "Contract", "Internship"];

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: JobType;
  status: JobStatus;
  openings: number;
  experience: string;
  postedOn: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  jobId: string;
  jobTitle: string;
  stage: PipelineStage;
  appliedOn: string;
  resumeUrl?: string;
  notes?: string;
  /** Not part of the real HRMS API (Add/Update Candidate only take
   * name/email/phone/jobId/resumeUrl/notes) — kept optional so the UI
   * degrades gracefully rather than fabricating placeholder values. */
  experience?: string;
  skills?: string[];
  rating?: number;
  source?: string;
}

export type InterviewMode = "Onsite" | "Video" | "Phone";
export type InterviewStatus = "Scheduled" | "Completed" | "Cancelled";

export interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  interviewer: string;
  date: string;
  time: string;
  status: InterviewStatus;
  notes?: string;
  /** Not part of the real HRMS API (Schedule Interview only takes
   * candidateId/scheduledAt/interviewer) — kept optional/defensive. */
  mode?: InterviewMode;
  round?: string;
}

export interface RecruitmentStats {
  openPositions: number;
  totalCandidates: number;
  interviewsThisWeek: number;
  offersExtended: number;
}
