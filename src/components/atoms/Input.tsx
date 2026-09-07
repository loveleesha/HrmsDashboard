import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-lg border bg-surface-card px-3 text-fs-lg text-ink placeholder:text-muted-light",
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

Input.displayName = "Input";
