import { DatePicker } from "@/components/molecules/DatePicker";
import { FormField } from "@/components/molecules/FormField";

export interface DatePickerFieldProps {
  label: string;
  id?: string;
  /** YYYY-MM-DD, or "" for none. */
  value: string;
  /** Kept event-shaped (`e.target.value`) so existing call sites needn't change. */
  onChange?: (event: { target: { value: string } }) => void;
  min?: string;
  max?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  placeholder?: string;
  className?: string;
}

export function DatePickerField({ label, id, value, onChange, min, max, error, required, disabled, clearable, placeholder, className }: DatePickerFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <FormField label={label} htmlFor={fieldId} error={error} required={required} className={className}>
      <DatePicker
        id={fieldId}
        value={value}
        onChange={(next) => onChange?.({ target: { value: next } })}
        min={min}
        max={max}
        invalid={Boolean(error)}
        disabled={disabled}
        clearable={clearable}
        placeholder={placeholder}
      />
    </FormField>
  );
}
