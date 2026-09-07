import type { AppraisalEntry } from "@/types/appraisal";

/**
 * Mock appraisal service. Replace the body of getMyAppraisals with a real
 * API call once the Node.js backend exists.
 */

export const MOCK_APPRAISALS: AppraisalEntry[] = [
  {
    id: "APR-01",
    cycle: "H1 FY26 (Apr – Sep 2026)",
    rating: 0,
    ratingLabel: "—",
    reviewedBy: "Karan Malhotra",
    date: "—",
    status: "Scheduled",
    comments: "Review cycle opens after September 30th.",
  },
  {
    id: "APR-02",
    cycle: "H2 FY25 (Oct 2025 – Mar 2026)",
    rating: 4,
    ratingLabel: "Exceeds Expectations",
    reviewedBy: "Karan Malhotra",
    date: "2026-04-12",
    status: "Completed",
    comments: "Consistently delivered high-quality work and mentored two junior engineers this cycle.",
  },
  {
    id: "APR-03",
    cycle: "H1 FY25 (Apr – Sep 2025)",
    rating: 4,
    ratingLabel: "Exceeds Expectations",
    reviewedBy: "Karan Malhotra",
    date: "2025-10-08",
    status: "Completed",
    comments: "Strong ownership of the attendance module rewrite; great cross-team collaboration.",
  },
  {
    id: "APR-04",
    cycle: "H2 FY24 (Oct 2024 – Mar 2025)",
    rating: 3,
    ratingLabel: "Meets Expectations",
    reviewedBy: "Karan Malhotra",
    date: "2025-04-15",
    status: "Completed",
    comments: "Solid, dependable contributor. Encouraged to take more initiative on design discussions.",
  },
];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getMyAppraisals(): Promise<AppraisalEntry[]> {
  await delay(200);
  return MOCK_APPRAISALS;
}
