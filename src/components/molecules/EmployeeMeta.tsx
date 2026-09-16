import { MapPin, Building2 } from "lucide-react";

export interface EmployeeMetaProps {
  department: string;
  location?: string;
}

export function EmployeeMeta({ department, location }: EmployeeMetaProps) {
  return (
    <div className="flex items-center justify-center gap-3 text-fs-sm text-muted">
      <span className="flex items-center gap-1">
        <Building2 className="size-3.5" />
        {department}
      </span>
      {location && (
        <span className="flex items-center gap-1">
          <MapPin className="size-3.5" />
          {location}
        </span>
      )}
    </div>
  );
}
