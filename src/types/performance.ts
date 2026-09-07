export type GoalStatus = "Not Started" | "On Track" | "At Risk" | "Completed";

export const GOAL_STATUSES: GoalStatus[] = ["Not Started", "On Track", "At Risk", "Completed"];

export interface Goal {
  id: string;
  employeeId: string;
  title: string;
  description: string;
  progress: number;
  status: GoalStatus;
  dueDate: string;
}

export interface TeamPerformanceRow {
  employeeId: string;
  employeeName: string;
  designation: string;
  currentRating: number;
  ratingLabel: string;
  goalsCompleted: number;
  goalsTotal: number;
  lastReviewDate: string;
}
