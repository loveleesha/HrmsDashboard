import type { Project, ProjectAllocation } from "@/types/project";

/**
 * Mock project allocation service. Replace the bodies of these functions
 * with real API calls once the Node.js backend exists.
 */

export const MOCK_PROJECTS: Project[] = [
  { id: "PRJ-01", name: "Hike Portal Revamp" },
  { id: "PRJ-02", name: "Client Onboarding Suite" },
  { id: "PRJ-03", name: "Payments Gateway Integration" },
  { id: "PRJ-04", name: "Mobile App v2" },
  { id: "PRJ-05", name: "Internal Analytics Dashboard" },
  { id: "PRJ-06", name: "Vendor Management System" },
  { id: "PRJ-07", name: "Customer Support Bot" },
  { id: "PRJ-08", name: "Data Warehouse Migration" },
  { id: "PRJ-09", name: "Retail POS Modernization" },
  { id: "PRJ-10", name: "Miscellaneous / Bench" },
];

export const MOCK_ALLOCATIONS: ProjectAllocation[] = [
  { projectId: "PRJ-01", projectName: "Hike Portal Revamp", allocatedHoursPerDay: 8, status: "Active", dsrLoggedHours: 705 },
  { projectId: "PRJ-02", projectName: "Client Onboarding Suite", allocatedHoursPerDay: 2, status: "Released", dsrLoggedHours: 637.25 },
  { projectId: "PRJ-03", projectName: "Payments Gateway Integration", allocatedHoursPerDay: 1, status: "Released", dsrLoggedHours: 587.03 },
  { projectId: "PRJ-04", projectName: "Mobile App v2", allocatedHoursPerDay: 4, status: "Released", dsrLoggedHours: 151 },
  { projectId: "PRJ-05", projectName: "Internal Analytics Dashboard", allocatedHoursPerDay: 0.75, status: "Released", dsrLoggedHours: 490.03 },
  { projectId: "PRJ-06", projectName: "Vendor Management System", allocatedHoursPerDay: 2, status: "Released", dsrLoggedHours: 1118.25 },
  { projectId: "PRJ-07", projectName: "Customer Support Bot", allocatedHoursPerDay: 0.75, status: "Released", dsrLoggedHours: 245.23 },
  { projectId: "PRJ-08", projectName: "Data Warehouse Migration", allocatedHoursPerDay: 0.5, status: "Released", dsrLoggedHours: 274.08 },
  { projectId: "PRJ-09", projectName: "Retail POS Modernization", allocatedHoursPerDay: 4, status: "Released", dsrLoggedHours: 32 },
  { projectId: "PRJ-10", projectName: "Miscellaneous / Bench", allocatedHoursPerDay: 1, status: "Active", dsrLoggedHours: 51.17 },
];

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
