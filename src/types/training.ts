import type { Role } from "@/types/user";

export type TrainingStatus = "Upcoming" | "Ongoing" | "Completed";
export type TrainingMode = "Online" | "Offline" | "Hybrid";

export interface TrainingProgram {
  id: string;
  topic: string;
  targetRole: Role;
  trainer: string;
  mode: TrainingMode;
  date: string;
  status: TrainingStatus;
  enrolled: number;
}
