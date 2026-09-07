import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const Radio = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    type="radio"
    className={cn(
      "size-4 border-border-strong text-primary focus:ring-2 focus:ring-primary/30",
      className
    )}
    {...props}
  />
));

Radio.displayName = "Radio";
