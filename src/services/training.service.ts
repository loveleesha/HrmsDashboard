import type { TrainingProgram } from "@/types/training";

/**
 * Mock training service. Replace the bodies of these functions with real
 * API calls once the Node.js backend exists.
 */

export const MOCK_TRAINING_PROGRAMS: TrainingProgram[] = [];

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
