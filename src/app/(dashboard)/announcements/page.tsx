"use client";

import { useEffect, useState } from "react";
import { Plus, Megaphone } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { AnnouncementForm, type AnnouncementFormValues } from "@/components/organisms/announcements/AnnouncementForm";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/use-rbac";
import { getAnnouncements, newAnnouncementId } from "@/services/announcement.service";
import type { Announcement } from "@/types/announcement";

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { can } = useRBAC();

  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const canAdd = can("announcements", "add");

  useEffect(() => {
    let isMounted = true;
    getAnnouncements().then((data) => {
      if (isMounted) setAnnouncements(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  function handleSubmit(values: AnnouncementFormValues) {
    const newAnnouncement: Announcement = {
      id: newAnnouncementId(),
      title: values.title,
      body: values.body,
      priority: values.priority,
      postedBy: user?.name ?? "HR",
      date: new Date().toISOString().slice(0, 10),
    };
    setAnnouncements((prev) => [newAnnouncement, ...(prev ?? [])]);
    setFormOpen(false);
    showToast("Announcement published.");
  }

  return (
    <div>
      <PageHeader
        title="Announcements"
        description="Company-wide announcements."
        actions={
          canAdd ? (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="size-4" />
              New Announcement
            </Button>
          ) : undefined
        }
      />

      {!announcements ? (
        <div className="flex items-center justify-center gap-2 py-24 text-muted">
          <Spinner />
          Loading announcements…
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="rounded-xl border border-border bg-surface-card p-5">
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <Megaphone className="size-4" />
                  </span>
                  <p className="text-fs-xl font-semibold text-ink">{announcement.title}</p>
                </div>
                {announcement.priority === "High" && <Badge tone="danger">High Priority</Badge>}
              </div>
              <p className="text-fs-base text-muted">{announcement.body}</p>
              <p className="mt-2 text-fs-sm text-muted-light">
                {announcement.postedBy} ·{" "}
                {new Date(announcement.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </div>
          ))}
        </div>
      )}

      <AnnouncementForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} />
    </div>
  );
}
