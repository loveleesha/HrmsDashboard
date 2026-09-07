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

const MOCK_RECOGNITIONS: Recognition[] = [
  {
    id: "rec-1",
    fromId: "EMP-1042",
    fromName: "Riya Kapoor",
    toId: "EMP-1101",
    toName: "Aarav Sharma",
    badge: "team-player",
    message: "Thank you for helping the team complete the release ahead of schedule.",
    likes: 12,
    createdAt: "2026-09-07T07:30:00",
    timestamp: "2 hours ago",
  },
  {
    id: "rec-2",
    fromId: "EMP-1015",
    fromName: "Karan Malhotra",
    toId: "EMP-1120",
    toName: "Diya Patel",
    badge: "innovator",
    message: "The new design system proposal is going to save the team weeks of rework. Brilliant thinking!",
    likes: 18,
    createdAt: "2026-09-06T14:10:00",
    timestamp: "Yesterday",
  },
  {
    id: "rec-3",
    fromId: "EMP-1430",
    fromName: "Siddharth Rao",
    toId: "EMP-1438",
    toName: "Nikita Malhotra",
    badge: "customer-champion",
    message: "Handled an escalated client call flawlessly and turned a frustrated customer into a promoter.",
    likes: 9,
    createdAt: "2026-09-06T11:05:00",
    timestamp: "Yesterday",
  },
  {
    id: "rec-4",
    fromId: "EMP-1410",
    fromName: "Priya Menon",
    toId: "EMP-1418",
    toName: "Anika Bose",
    badge: "extra-mile",
    message: "Stayed back late to get the campaign assets ready for the launch. Really appreciate the effort!",
    likes: 14,
    createdAt: "2026-09-05T18:20:00",
    timestamp: "2 days ago",
  },
  {
    id: "rec-5",
    fromId: "EMP-1021",
    fromName: "Ananya Iyer",
    toId: "EMP-1033",
    toName: "Simran Kaur",
    badge: "go-getter",
    message: "Closed 4 critical open positions this month, ahead of every deadline.",
    likes: 21,
    createdAt: "2026-09-05T09:45:00",
    timestamp: "2 days ago",
  },
  {
    id: "rec-6",
    fromId: "EMP-1101",
    fromName: "Aarav Sharma",
    toId: "EMP-1256",
    toName: "Ishaan Gupta",
    badge: "problem-solver",
    message: "Root-caused a tricky production bug in under an hour. Saved us a lot of downtime.",
    likes: 16,
    createdAt: "2026-09-04T16:00:00",
    timestamp: "3 days ago",
  },
  {
    id: "rec-7",
    fromId: "EMP-1450",
    fromName: "Kabir Singh",
    toId: "EMP-1458",
    toName: "Neha Joshi",
    badge: "helping-hand",
    message: "Jumped in to coordinate the office move over the weekend without being asked.",
    likes: 11,
    createdAt: "2026-09-03T10:30:00",
    timestamp: "4 days ago",
  },
  {
    id: "rec-8",
    fromId: "EMP-1120",
    fromName: "Diya Patel",
    toId: "EMP-1015",
    toName: "Karan Malhotra",
    badge: "mentor",
    message: "Your weekly 1:1s have genuinely shaped how I approach system design. Thank you for the guidance.",
    likes: 24,
    createdAt: "2026-09-02T13:15:00",
    timestamp: "5 days ago",
  },
  {
    id: "rec-9",
    fromId: "EMP-1301",
    fromName: "Tanvi Shah",
    toId: "EMP-1410",
    toName: "Priya Menon",
    badge: "leadership",
    message: "Steered the Q3 town hall with clarity and made everyone feel heard.",
    likes: 19,
    createdAt: "2026-09-01T09:00:00",
    timestamp: "6 days ago",
  },
  {
    id: "rec-10",
    fromId: "EMP-1033",
    fromName: "Simran Kaur",
    toId: "EMP-1101",
    toName: "Aarav Sharma",
    badge: "star-performer",
    message: "Consistently the most reliable engineer on the team, sprint after sprint.",
    likes: 15,
    createdAt: "2026-08-30T15:40:00",
    timestamp: "1 week ago",
  },
  {
    id: "rec-11",
    fromId: "EMP-1418",
    fromName: "Anika Bose",
    toId: "EMP-1410",
    toName: "Priya Menon",
    badge: "goal-crusher",
    message: "Hit the quarterly lead-gen target two weeks early with room to spare.",
    likes: 13,
    createdAt: "2026-08-29T11:20:00",
    timestamp: "1 week ago",
  },
];

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
  const now = new Date("2026-09-07T12:00:00");
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
