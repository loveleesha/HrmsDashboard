import { MapPin, Building2 } from "lucide-react";

export interface EmployeeMetaProps {
  department: string;
  city: string;
}

export function EmployeeMeta({ department, city }: EmployeeMetaProps) {
  return (
    <div className="flex items-center justify-center gap-3 text-fs-sm text-muted">
      <span className="flex items-center gap-1">
        <Building2 className="size-3.5" />
        {department}
      </span>
      <span className="flex items-center gap-1">
        <MapPin className="size-3.5" />
        {city}
      </span>
    </div>
  );
}
