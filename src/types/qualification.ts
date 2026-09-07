export const QUALIFICATION_TYPES = [
  "10th Standard",
  "12th Standard",
  "Graduation",
  "Post Graduation",
  "Certification",
] as const;
export type QualificationType = (typeof QUALIFICATION_TYPES)[number];

export interface QualificationEntry {
  id: string;
  type: QualificationType;
  institution: string;
  board: string;
  period: string;
}
