"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  widthClassName?: string;
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  widthClassName = "sm:max-w-md",
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-end sm:items-stretch">
      <div
        className="absolute inset-0 bg-ink/35"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-10 flex max-h-[88vh] w-full flex-col rounded-t-2xl border-t border-border bg-surface-card shadow-xl",
          "sm:h-full sm:max-h-none sm:w-full sm:rounded-t-none sm:rounded-l-2xl sm:border-t-0 sm:border-l",
          widthClassName
        )}
      >
        {(title || description) && (
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              {title && <h2 className="text-fs-2xl font-semibold text-ink">{title}</h2>}
              {description && <p className="mt-0.5 text-fs-base text-muted">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close panel"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-ink"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="shrink-0 border-t border-border px-5 py-4">{footer}</div>
        )}
      </div>
    </div>,
    document.body
  );
}
