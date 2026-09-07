export type AppraisalStatus = "Completed" | "In Progress" | "Scheduled";

export interface AppraisalEntry {
  id: string;
  cycle: string;
  rating: number;
  ratingLabel: string;
  reviewedBy: string;
  date: string;
  status: AppraisalStatus;
  comments: string;
}
