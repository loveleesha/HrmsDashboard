export type AnnouncementPriority = "High" | "Normal";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  postedBy: string;
  date: string;
  priority: AnnouncementPriority;
}
