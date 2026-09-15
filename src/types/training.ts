export type TrainingStatus = "Upcoming" | "Ongoing" | "Completed";
export type TrainingMode = "Online" | "Offline" | "Hybrid";

export interface TrainingProgram {
  id: string;
  topic: string;
  /** A role name from the live Settings -> Role & Access list — not
   * constrained to this app's built-in Role union, since any role defined
   * there can be targeted. */
  targetRole: string;
  trainer: string;
  mode: TrainingMode;
  date: string;
  status: TrainingStatus;
  enrolled: number;
}
