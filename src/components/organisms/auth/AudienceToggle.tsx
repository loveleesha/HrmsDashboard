"use client";

import { useRouter } from "next/navigation";
import { ShieldCheck, User as UserIcon } from "lucide-react";
import type { AuthAudience } from "@/services/auth.service";
import { cn } from "@/lib/cn";

const OPTIONS: { value: AuthAudience; label: string; icon: typeof UserIcon }[] = [
  { value: "user", label: "Login as User", icon: UserIcon },
  { value: "admin", label: "Login as Admin", icon: ShieldCheck },
];

export interface AudienceToggleProps {
  audience: AuthAudience;
  /** Where each option navigates to — differs per flow (login vs forgot vs reset password). */
  routes: Record<AuthAudience, string>;
  className?: string;
}

/**
 * Shared "which portal am I in" switcher for every unauthenticated auth page
 * (login, forgot-password, reset-password) — the "HRMS API" collection
 * splits User and Admin into separate endpoints/audiences (see
 * auth.service.ts's AuthAudience), so every auth page needs a way to pick
 * one. Selecting the inactive tab navigates to that flow's audience route.
 */
export function AudienceToggle({ audience, routes, className }: AudienceToggleProps) {
  const router = useRouter();

  return (
    <div
      role="tablist"
      aria-label="Sign in as"
      className={cn("mb-5 grid grid-cols-2 gap-1 rounded-lg bg-surface p-1", className)}
    >
      {OPTIONS.map((option) => {
        const isActive = option.value === audience;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => {
              if (!isActive) router.push(routes[option.value]);
            }}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-fs-base font-medium transition-colors",
              isActive ? "bg-surface-card text-ink shadow-sm" : "text-muted hover:text-ink"
            )}
          >
            <option.icon className="size-4" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
