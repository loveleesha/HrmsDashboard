import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-lg border bg-surface-card px-3 py-2 text-fs-lg text-ink placeholder:text-muted-light",
          "focus:outline-none focus:ring-2 focus:ring-primary/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
          invalid ? "border-danger" : "border-border focus:border-primary",
          className
        )}
        aria-invalid={invalid}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
