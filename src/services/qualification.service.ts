import type { QualificationEntry } from "@/types/qualification";

/**
 * Mock qualification service. Replace the body of getMyQualifications with
 * a real API call once the Node.js backend exists.
 */

export const MOCK_QUALIFICATIONS: QualificationEntry[] = [
  { id: "QUAL-01", type: "10th Standard", institution: "Delhi Public School, R.K. Puram", board: "CBSE", period: "2010" },
  { id: "QUAL-02", type: "12th Standard", institution: "Delhi Public School, R.K. Puram", board: "CBSE", period: "2012" },
  { id: "QUAL-03", type: "Graduation", institution: "Delhi Technological University", board: "B.Tech, Computer Science", period: "2012 – 2016" },
  { id: "QUAL-04", type: "Certification", institution: "AWS Certified Solutions Architect – Associate", board: "Amazon Web Services", period: "2023" },
];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getMyQualifications(): Promise<QualificationEntry[]> {
  await delay(200);
  return MOCK_QUALIFICATIONS;
}

export function newQualificationId(): string {
  return `QUAL-${Math.floor(10 + Math.random() * 89)}`;
}
