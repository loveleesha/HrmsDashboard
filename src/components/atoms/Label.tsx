import { forwardRef, type LabelHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const Label = forwardRef<
  HTMLLabelElement,
  LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn("text-fs-base font-medium text-ink", className)}
    {...props}
  />
));

Label.displayName = "Label";
