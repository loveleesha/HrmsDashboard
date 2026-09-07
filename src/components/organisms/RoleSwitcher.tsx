"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ShieldCheck, Check } from "lucide-react";
import { ROLES, ROLE_LABELS } from "@/types/user";
import { useRBAC } from "@/hooks/use-rbac";
import { cn } from "@/lib/cn";

export function RoleSwitcher() {
  const { viewAsRole, setViewAsRole, isSimulating } = useRBAC();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex h-10 items-center gap-1.5 rounded-lg border px-2.5 text-fs-base font-medium transition-colors sm:px-3",
          isSimulating
            ? "border-primary-border bg-primary-soft text-primary"
            : "border-border bg-surface-card text-ink hover:border-border-strong"
        )}
      >
        <ShieldCheck className="size-4 shrink-0" />
        <span className="hidden sm:inline text-muted">View As:</span>
        <span className="max-w-[7rem] truncate sm:max-w-[9rem]">{ROLE_LABELS[viewAsRole]}</span>
        <ChevronDown className="size-3.5 shrink-0 text-muted-light" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-border bg-surface-card p-1 shadow-lg"
        >
          <div className="px-3 py-2">
            <p className="text-fs-sm font-semibold uppercase tracking-wide text-muted-light">
              RBAC Preview
            </p>
            <p className="mt-0.5 text-fs-sm text-muted">
              Simulate how the app looks for each role.
            </p>
          </div>
          <div className="my-1 h-px bg-border" />
          {ROLES.map((role) => (
            <button
              key={role}
              type="button"
              role="menuitem"
              onClick={() => {
                setViewAsRole(role);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-fs-base",
                role === viewAsRole ? "bg-primary-soft text-primary font-medium" : "text-ink hover:bg-surface"
              )}
            >
              {ROLE_LABELS[role]}
              {role === viewAsRole && <Check className="size-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
