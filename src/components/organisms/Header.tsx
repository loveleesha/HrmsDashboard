"use client";

import { useEffect, useState } from "react";
import { Menu, Moon, Sun } from "lucide-react";
import { SearchInput } from "@/components/molecules/SearchInput";
import { UserMenu } from "@/components/molecules/UserMenu";
import { NotificationPanel, type NotificationItem } from "@/components/organisms/NotificationPanel";
import { useSidebar } from "@/hooks/use-sidebar";
import { useTheme } from "@/hooks/use-theme";
import { getDashboardData } from "@/services/dashboard.service";

export function Header() {
  const { openMobile } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    getDashboardData().then((data) => {
      if (!isMounted) return;
      setNotifications(
        data.recentActivity.map((activity, index) => ({
          title: `${activity.actor} ${activity.action}`,
          description: "",
          timestamp: activity.timestamp,
          unread: index < 2,
        }))
      );
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface-card px-4 sm:px-6">
      <button
        type="button"
        onClick={openMobile}
        className="flex size-10 items-center justify-center rounded-lg text-muted hover:bg-surface lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      <div className="min-w-0 flex-1">
        <SearchInput
          placeholder="Search employees, requests, documents…"
          className="hidden max-w-sm sm:block"
        />
      </div>

      <button
        type="button"
        onClick={toggleTheme}
        className="flex size-10 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-ink"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </button>

      <NotificationPanel notifications={notifications} />

      <UserMenu />
    </header>
  );
}
