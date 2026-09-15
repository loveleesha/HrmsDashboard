import type { Goal, TeamPerformanceRow } from "@/types/performance";

/**
 * Mock performance service. Replace the bodies of these functions with
 * real API calls once the Node.js backend exists.
 */

export const MOCK_GOALS: Goal[] = [];

export const MOCK_TEAM_PERFORMANCE: TeamPerformanceRow[] = [];

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
