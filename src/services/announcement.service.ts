import type { Announcement } from "@/types/announcement";

/**
 * Mock announcements service. Replace the bodies of these functions with
 * real API calls once the Node.js backend exists.
 */

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ANN-01",
    title: "Q3 town hall — Sep 12",
    body: "Join the all-hands town hall to hear Q3 results and the Q4 roadmap. Calendar invite has been sent to everyone.",
    postedBy: "Vikram Mehta",
    date: "2026-09-05",
    priority: "High",
  },
  {
    id: "ANN-02",
    title: "New health insurance partner",
    body: "HR has onboarded a new health insurance provider effective October 1st. Updated policy documents are available under Documents.",
    postedBy: "Ananya Iyer",
    date: "2026-09-02",
    priority: "Normal",
  },
  {
    id: "ANN-03",
    title: "Office Wi-Fi maintenance — Sep 8, 11 PM–1 AM",
    body: "IT will be upgrading office Wi-Fi infrastructure overnight. Expect brief connectivity drops if you're working late.",
    postedBy: "IT Operations",
    date: "2026-09-06",
    priority: "Normal",
  },
  {
    id: "ANN-04",
    title: "Ganesh Chaturthi holiday — Sep 14",
    body: "The office will remain closed on September 14th for Ganesh Chaturthi. Regular hours resume September 15th.",
    postedBy: "Ananya Iyer",
    date: "2026-08-30",
    priority: "High",
  },
  {
    id: "ANN-05",
    title: "Referral bonus program refreshed",
    body: "Referral bonuses have been revised upward across all experience bands. Check the Recruitment page for the updated slabs.",
    postedBy: "Simran Kaur",
    date: "2026-08-25",
    priority: "Normal",
  },
];

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
