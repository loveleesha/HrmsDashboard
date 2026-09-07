"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/cn";

export interface NotificationItem {
  title: string;
  description: string;
  timestamp: string;
  unread?: boolean;
}

export interface NotificationPanelProps {
  notifications: NotificationItem[];
}

export function NotificationPanel({ notifications }: NotificationPanelProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((item) => item.unread).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex size-10 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-ink"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Notifications"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-border bg-surface-card shadow-lg">
          <div className="border-b border-border px-4 py-3">
            <p className="text-fs-lg font-semibold text-ink">Notifications</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-fs-base text-muted">
                You&apos;re all caught up.
              </p>
            ) : (
              notifications.map((item, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex flex-col gap-1 border-b border-border px-4 py-3 last:border-b-0",
                    item.unread && "bg-primary-softer"
                  )}
                >
                  <p className="text-fs-base font-medium text-ink">
                    {item.title}
                  </p>
                  <p className="text-fs-sm text-muted">{item.description}</p>
                  <p className="text-fs-sm text-muted-light">{item.timestamp}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
