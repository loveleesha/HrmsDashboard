import type { PerformanceLabel } from "@/types/employee";

export function getPerformanceLabel(score: number): PerformanceLabel {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Average";
  return "Low";
}

export const PERFORMANCE_TONE: Record<
  PerformanceLabel,
  "success" | "info" | "warning" | "danger"
> = {
  Excellent: "success",
  Good: "info",
  Average: "warning",
  Low: "danger",
};

export const PERFORMANCE_BAR_COLOR: Record<PerformanceLabel, string> = {
  Excellent: "bg-success",
  Good: "bg-info",
  Average: "bg-warning",
  Low: "bg-danger",
};

export const PERFORMANCE_TEXT_COLOR: Record<PerformanceLabel, string> = {
  Excellent: "text-success",
  Good: "text-info",
  Average: "text-warning",
  Low: "text-danger",
};
