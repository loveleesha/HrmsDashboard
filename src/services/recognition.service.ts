import {
  Handshake,
  Puzzle,
  HeartHandshake,
  Rocket,
  GraduationCap,
  Sparkles,
  Crown,
  HandHeart,
  Star,
  Zap,
  Target,
} from "lucide-react";
import type { BadgeKey, Recognition, RecognitionBadgeDef, RecognitionSummary } from "@/types/recognition";

/**
 * Mock peer recognition service. Replace the body of getRecognitions /
 * addRecognition with real API calls once the Node.js backend exists —
 * callers only depend on these functions' signatures.
 */

export const RECOGNITION_BADGES: RecognitionBadgeDef[] = [
  {
    key: "team-player",
    label: "Team Player",
    description: "Recognizes collaboration, support and teamwork.",
    icon: Handshake,
  },
  {
    key: "problem-solver",
    label: "Problem Solver",
    description: "For untangling a tough problem with a clever solution.",
    icon: Puzzle,
  },
  {
    key: "customer-champion",
    label: "Customer Champion",
    description: "For going above and beyond for a customer.",
    icon: HeartHandshake,
  },
  {
    key: "extra-mile",
    label: "Going the Extra Mile",
    description: "For putting in extra effort to get things done right.",
    icon: Rocket,
  },
  {
    key: "mentor",
    label: "Mentor",
    description: "For guiding and developing a teammate's growth.",
    icon: GraduationCap,
  },
  {
    key: "innovator",
    label: "Innovator",
    description: "For a fresh idea that made things better.",
    icon: Sparkles,
  },
  {
    key: "leadership",
    label: "Leadership",
    description: "For setting direction and inspiring the team.",
    icon: Crown,
  },
  {
    key: "helping-hand",
    label: "Helping Hand",
    description: "For stepping in to help a colleague in need.",
    icon: HandHeart,
  },
  {
    key: "star-performer",
    label: "Star Performer",
    description: "For consistently excellent, standout work.",
    icon: Star,
  },
  {
    key: "go-getter",
    label: "Go-Getter",
    description: "For proactively driving results without being asked.",
    icon: Zap,
  },
  {
    key: "goal-crusher",
    label: "Goal Crusher",
    description: "For smashing a target ahead of schedule.",
    icon: Target,
  },
];

export function getBadgeDef(key: BadgeKey): RecognitionBadgeDef {
  return RECOGNITION_BADGES.find((badge) => badge.key === key) ?? RECOGNITION_BADGES[0];
}

const MOCK_RECOGNITIONS: Recognition[] = [];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getRecognitions(): Promise<Recognition[]> {
  await delay(250);
  return [...MOCK_RECOGNITIONS].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function buildSummary(recognitions: Recognition[], employeeId: string | undefined): RecognitionSummary {
  const given = recognitions.filter((r) => r.fromId === employeeId).length;
  const received = recognitions.filter((r) => r.toId === employeeId).length;
  const badgesEarned = new Set(
    recognitions.filter((r) => r.toId === employeeId).map((r) => r.badge)
  ).size;
  const now = new Date();
  const thisMonth = recognitions.filter((r) => {
    const date = new Date(r.createdAt);
    return (
      (r.toId === employeeId || r.fromId === employeeId) &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }).length;

  return { given, received, badgesEarned, thisMonth };
}

export interface LeaderboardEntry {
  employeeId: string;
  name: string;
  count: number;
}

export function buildLeaderboard(recognitions: Recognition[]): LeaderboardEntry[] {
  const counts = new Map<string, LeaderboardEntry>();
  for (const recognition of recognitions) {
    const existing = counts.get(recognition.toId);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(recognition.toId, {
        employeeId: recognition.toId,
        name: recognition.toName,
        count: 1,
      });
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 5);
}
