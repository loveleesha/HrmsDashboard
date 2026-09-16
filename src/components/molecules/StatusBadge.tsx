import { Badge } from "@/components/atoms/Badge";

const STATUS_TONE_MAP: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  present: "success",
  active: "success",
  approved: "success",
  hired: "success",
  completed: "success",
  open: "success",
  remote: "info",
  interview: "info",
  offer: "info",
  scheduled: "info",
  upcoming: "info",
  ongoing: "warning",
  "on track": "info",
  "at risk": "warning",
  "not started": "neutral",
  reimbursed: "success",
  verified: "success",
  "pending review": "warning",
  screening: "warning",
  late: "warning",
  pending: "warning",
  "in progress": "warning",
  "on leave": "warning",
  "on-leave": "warning",
  "on hold": "warning",
  terminated: "danger",
  absent: "danger",
  rejected: "danger",
  cancelled: "neutral",
  applied: "neutral",
  closed: "neutral",
  inactive: "neutral",
};

export interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const tone = STATUS_TONE_MAP[status.toLowerCase()] ?? "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}
