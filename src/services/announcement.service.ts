import type { Announcement } from "@/types/announcement";

/**
 * Mock announcements service. Replace the bodies of these functions with
 * real API calls once the Node.js backend exists.
 */

export const MOCK_ANNOUNCEMENTS: Announcement[] = [];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getAnnouncements(): Promise<Announcement[]> {
  await delay(200);
  return [...MOCK_ANNOUNCEMENTS].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function newAnnouncementId(): string {
  return `ANN-${Math.floor(10 + Math.random() * 89)}`;
}
