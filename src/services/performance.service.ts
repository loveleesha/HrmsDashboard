import type { Goal, TeamPerformanceRow } from "@/types/performance";

/**
 * Mock performance service. Replace the bodies of these functions with
 * real API calls once the Node.js backend exists.
 */

export const MOCK_GOALS: Goal[] = [
  {
    id: "GOAL-01",
    employeeId: "EMP-1101",
    title: "Ship the Leave Management module",
    description: "Design and build the full leave application, approval, and balance-tracking flow.",
    progress: 100,
    status: "Completed",
    dueDate: "2026-09-05",
  },
  {
    id: "GOAL-02",
    employeeId: "EMP-1101",
    title: "Reduce attendance page load time by 30%",
    description: "Profile and optimize the attendance calendar rendering path.",
    progress: 65,
    status: "On Track",
    dueDate: "2026-09-30",
  },
  {
    id: "GOAL-03",
    employeeId: "EMP-1101",
    title: "Mentor two junior engineers",
    description: "Run weekly pairing sessions and code reviews for onboarding engineers.",
    progress: 40,
    status: "At Risk",
    dueDate: "2026-10-15",
  },
  {
    id: "GOAL-04",
    employeeId: "EMP-1101",
    title: "Complete AWS Solutions Architect renewal",
    description: "Recertify before the current certification expires.",
    progress: 0,
    status: "Not Started",
    dueDate: "2026-12-01",
  },
];

export const MOCK_TEAM_PERFORMANCE: TeamPerformanceRow[] = [
  { employeeId: "EMP-1101", employeeName: "Aarav Sharma", designation: "Senior Software Engineer", currentRating: 4, ratingLabel: "Exceeds Expectations", goalsCompleted: 1, goalsTotal: 4, lastReviewDate: "2026-04-12" },
  { employeeId: "EMP-1204", employeeName: "Meera Nair", designation: "QA Engineer", currentRating: 3, ratingLabel: "Meets Expectations", goalsCompleted: 2, goalsTotal: 3, lastReviewDate: "2026-04-10" },
  { employeeId: "EMP-1188", employeeName: "Aditya Rao", designation: "Backend Engineer", currentRating: 2, ratingLabel: "Needs Improvement", goalsCompleted: 1, goalsTotal: 3, lastReviewDate: "2026-04-08" },
  { employeeId: "EMP-1256", employeeName: "Ishaan Gupta", designation: "Frontend Engineer", currentRating: 5, ratingLabel: "Outstanding", goalsCompleted: 4, goalsTotal: 4, lastReviewDate: "2026-04-11" },
  { employeeId: "EMP-1301", employeeName: "Tanvi Shah", designation: "DevOps Engineer", currentRating: 4, ratingLabel: "Exceeds Expectations", goalsCompleted: 3, goalsTotal: 3, lastReviewDate: "2026-04-09" },
];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getMyGoals(employeeId: string): Promise<Goal[]> {
  await delay(200);
  return MOCK_GOALS.filter((g) => g.employeeId === employeeId);
}

export async function getTeamPerformance(): Promise<TeamPerformanceRow[]> {
  await delay(200);
  return MOCK_TEAM_PERFORMANCE;
}

export function newGoalId(): string {
  return `GOAL-${Math.floor(10 + Math.random() * 89)}`;
}
