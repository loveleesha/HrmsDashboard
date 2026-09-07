import type { ReactNode } from "react";
import { Label } from "@/components/atoms/Label";
import { cn } from "@/lib/cn";

export interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-danger"> *</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-fs-sm text-danger">{error}</p>
      ) : hint ? (
        <p className="text-fs-sm text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
