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
import { httpService } from "@/lib/http/http.service";
import { API_ENDPOINTS } from "@/lib/apiEndpoint";
import type { BadgeKey, Recognition, RecognitionBadgeDef, RecognitionSummary } from "@/types/recognition";

/** Peer recognition service — wired to the real backend (routes/User/recognitionRoutes.js). */

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

interface RawRecognition {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  badge: BadgeKey;
  message: string;
  likes: number;
  likedByMe: boolean;
  createdAt: string;
}

function mapRawRecognition(raw: RawRecognition): Recognition {
  return {
    id: raw.id,
    fromId: raw.fromId,
    fromName: raw.fromName,
    toId: raw.toId,
    toName: raw.toName,
    badge: raw.badge,
    message: raw.message,
    likes: raw.likes,
    likedByMe: raw.likedByMe,
    createdAt: raw.createdAt,
    timestamp: raw.createdAt,
  };
}

export async function getRecognitions(): Promise<Recognition[]> {
  const data = await httpService.get<{ recognitions: RawRecognition[] }>(API_ENDPOINTS.user.recognition);
  return data.recognitions.map(mapRawRecognition);
}

export async function addRecognition(params: { toUserId: string; badge: BadgeKey; message: string }): Promise<Recognition> {
  const data = await httpService.post<{ recognition: RawRecognition }>(API_ENDPOINTS.user.recognition, params);
  return mapRawRecognition(data.recognition);
}

export async function toggleRecognitionLike(id: string): Promise<Recognition> {
  const data = await httpService.post<{ recognition: RawRecognition }>(API_ENDPOINTS.user.recognitionLike(id));
  return mapRawRecognition(data.recognition);
}

export async function deleteRecognition(id: string): Promise<void> {
  await httpService.delete(API_ENDPOINTS.user.recognitionById(id));
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
