import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const Checkbox = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    type="checkbox"
    className={cn(
      "size-4 rounded border-border-strong text-primary focus:ring-2 focus:ring-primary/30",
      className
    )}
    {...props}
  />
));

Checkbox.displayName = "Checkbox";
