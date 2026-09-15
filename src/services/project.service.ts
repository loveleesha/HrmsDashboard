import type { Project, ProjectAllocation } from "@/types/project";

/**
 * Mock project allocation service. Replace the bodies of these functions
 * with real API calls once the Node.js backend exists.
 */

export const MOCK_PROJECTS: Project[] = [];

export const MOCK_ALLOCATIONS: ProjectAllocation[] = [];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getProjects(): Promise<Project[]> {
  await delay(150);
  return MOCK_PROJECTS;
}

export async function getMyAllocations(): Promise<ProjectAllocation[]> {
  await delay(200);
  return MOCK_ALLOCATIONS;
}
