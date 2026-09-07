"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

export type ToastTone = "success" | "info";

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Portal target (document.body) only exists client-side; deferring to
    // after mount avoids a server/client markup mismatch on first render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const showToast = useCallback((message: string, tone: ToastTone = "success") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3500);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {mounted &&
        createPortal(
          <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[200] flex flex-col items-center gap-2 px-4 sm:items-end sm:right-4 sm:left-auto">
            {toasts.map((toast) => {
              const ToneIcon = toast.tone === "success" ? CheckCircle2 : Info;
              return (
                <div
                  key={toast.id}
                  className={cn(
                    "pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-lg border bg-surface-card px-4 py-3 shadow-lg",
                    toast.tone === "success" ? "border-success/30" : "border-info/30"
                  )}
                  role="status"
                >
                  <ToneIcon
                    className={cn(
                      "mt-0.5 size-4 shrink-0",
                      toast.tone === "success" ? "text-success" : "text-info"
                    )}
                  />
                  <p className="flex-1 text-fs-base text-ink">{toast.message}</p>
                  <button
                    type="button"
                    onClick={() => dismiss(toast.id)}
                    aria-label="Dismiss notification"
                    className="text-muted-light hover:text-ink"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
