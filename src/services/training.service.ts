import type { TrainingProgram } from "@/types/training";

/**
 * Mock training service. Replace the bodies of these functions with real
 * API calls once the Node.js backend exists.
 */

export const MOCK_TRAINING_PROGRAMS: TrainingProgram[] = [
  { id: "TRN-01", topic: "Secure Coding Fundamentals", targetRole: "employee", trainer: "Karan Malhotra", mode: "Online", date: "2026-09-15", status: "Upcoming", enrolled: 34 },
  { id: "TRN-02", topic: "First-Time Manager Bootcamp", targetRole: "manager", trainer: "Ananya Iyer", mode: "Offline", date: "2026-09-10", status: "Upcoming", enrolled: 8 },
  { id: "TRN-03", topic: "Effective Interviewing Techniques", targetRole: "recruiter", trainer: "Simran Kaur", mode: "Hybrid", date: "2026-08-28", status: "Completed", enrolled: 5 },
  { id: "TRN-04", topic: "Payroll Compliance Update FY26", targetRole: "payroll_admin", trainer: "Rohan Desai", mode: "Online", date: "2026-08-20", status: "Completed", enrolled: 3 },
  { id: "TRN-05", topic: "Advanced Excel for HR Reporting", targetRole: "hr_executive", trainer: "Riya Kapoor", mode: "Online", date: "2026-09-05", status: "Ongoing", enrolled: 12 },
  { id: "TRN-06", topic: "Leadership Communication Skills", targetRole: "special_employee", trainer: "Vikram Mehta", mode: "Offline", date: "2026-09-25", status: "Upcoming", enrolled: 6 },
];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getTrainingPrograms(): Promise<TrainingProgram[]> {
  await delay(200);
  return [...MOCK_TRAINING_PROGRAMS].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function newTrainingId(): string {
  return `TRN-${Math.floor(10 + Math.random() * 89)}`;
}
