import type { Candidate, Interview, JobPosting, PipelineStage } from "@/types/recruitment";

/**
 * Mock recruitment/ATS service. Replace the bodies of these functions with
 * real API calls once the Node.js backend exists — callers only depend on
 * the exported function signatures.
 */

export const MOCK_JOBS: JobPosting[] = [];

export const MOCK_CANDIDATES: Candidate[] = [];

export const MOCK_INTERVIEWS: Interview[] = [];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getJobs(): Promise<JobPosting[]> {
  await delay(200);
  return MOCK_JOBS;
}

export async function getCandidates(): Promise<Candidate[]> {
  await delay(250);
  return MOCK_CANDIDATES;
}

export async function getInterviews(): Promise<Interview[]> {
  await delay(200);
  return MOCK_INTERVIEWS;
}

export function nextStage(stage: PipelineStage): PipelineStage | null {
  const order: PipelineStage[] = ["Applied", "Screening", "Interview", "Offer", "Hired"];
  const index = order.indexOf(stage);
  if (index === -1 || index === order.length - 1) return null;
  return order[index + 1];
}

export function newJobId(): string {
  return `JOB-${Math.floor(200 + Math.random() * 700)}`;
}
