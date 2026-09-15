"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface ActionMenuItem {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  tone?: "default" | "danger";
  disabled?: boolean;
  /** Omit the item entirely (e.g. an RBAC check that failed) rather than showing it disabled. */
  hidden?: boolean;
}

export interface ActionMenuProps {
  items: ActionMenuItem[];
  ariaLabel?: string;
}

/**
 * A "..." menu for table row actions — keeps a row's actions to one button
 * instead of a wall of small buttons eating into column space. Renders via
 * a portal positioned from the trigger's own coordinates so it isn't
 * clipped by the table's horizontal-scroll container (see Table.tsx's
 * overflow-x-auto wrapper, which would otherwise clip anything absolutely
 * positioned inside it).
 */
export function ActionMenu({ items, ariaLabel = "Row actions" }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const visibleItems = items.filter((item) => !item.hidden);

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    updatePosition();

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  if (visibleItems.length === 0) return null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-ink"
      >
        <MoreVertical className="size-4" />
      </button>

      {open &&
        position &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ position: "fixed", top: position.top, right: position.right }}
            className="z-[100] w-48 rounded-lg border border-border bg-surface-card p-1 shadow-lg"
          >
            {visibleItems.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-fs-base disabled:cursor-not-allowed disabled:opacity-50",
                  item.tone === "danger" ? "text-danger hover:bg-danger-bg" : "text-ink hover:bg-surface"
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
