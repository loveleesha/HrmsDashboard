"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

export interface PopoverProps {
  open: boolean;
  /** The trigger the popover hangs off — clicks on it don't count as "outside". */
  anchorRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  width: number;
  children: ReactNode;
  ariaLabel?: string;
}

/**
 * A small floating panel rendered in a portal (so no `overflow` ancestor can
 * clip it) and positioned from its trigger: below it when there's room, above
 * otherwise, and always clamped inside the viewport — including 320px phones.
 */
export function Popover({ open, anchorRef, onClose, width, children, ariaLabel }: PopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) return;

    function place() {
      const anchor = anchorRef.current?.getBoundingClientRect();
      const panel = panelRef.current;
      if (!anchor || !panel) return;
      const height = panel.offsetHeight;
      const fitsBelow = window.innerHeight - anchor.bottom >= height + 12;
      const fitsAbove = anchor.top >= height + 12;
      const top = fitsBelow || !fitsAbove ? anchor.bottom + 6 : anchor.top - height - 6;
      setPosition({
        top: Math.max(8, Math.min(top, window.innerHeight - height - 8)),
        left: Math.max(8, Math.min(anchor.left, window.innerWidth - width - 8)),
      });
    }

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, anchorRef, width]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      onClose();
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, anchorRef, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label={ariaLabel}
      style={{
        position: "fixed",
        top: position?.top ?? 0,
        left: position?.left ?? 0,
        width,
        visibility: position ? "visible" : "hidden",
      }}
      className="z-[110] rounded-xl border border-border bg-surface-card p-3 shadow-xl"
    >
      {children}
    </div>,
    document.body
  );
}
