import { CalendarDays } from "lucide-react";
import { Input, type InputProps } from "@/components/atoms/Input";
import { FormField } from "@/components/molecules/FormField";

export interface DatePickerFieldProps extends Omit<InputProps, "type"> {
  label: string;
  error?: string;
}

export function DatePickerField({
  label,
  id,
  error,
  className,
  ...props
}: DatePickerFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <FormField label={label} htmlFor={fieldId} error={error}>
      <div className="relative">
        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-light" />
        <Input
          id={fieldId}
          type="date"
          className={`pl-9 ${className ?? ""}`}
          invalid={Boolean(error)}
          {...props}
        />
      </div>
    </FormField>
  );
}
