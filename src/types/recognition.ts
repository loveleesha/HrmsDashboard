import type { LucideIcon } from "lucide-react";

export type BadgeKey =
  | "team-player"
  | "problem-solver"
  | "customer-champion"
  | "extra-mile"
  | "mentor"
  | "innovator"
  | "leadership"
  | "helping-hand"
  | "star-performer"
  | "go-getter"
  | "goal-crusher";

export interface RecognitionBadgeDef {
  key: BadgeKey;
  label: string;
  description: string;
  icon: LucideIcon;
}

export interface Recognition {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  badge: BadgeKey;
  message: string;
  likes: number;
  likedByMe?: boolean;
  createdAt: string;
  timestamp: string;
}

export interface RecognitionSummary {
  given: number;
  received: number;
  badgesEarned: number;
  thisMonth: number;
}
