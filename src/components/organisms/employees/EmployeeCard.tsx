import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { EmployeeMeta } from "@/components/molecules/EmployeeMeta";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { EMPLOYMENT_STATUS_LABELS, type Employee } from "@/types/employee";

export interface EmployeeCardProps {
  employee: Employee;
  onViewProfile: (employee: Employee) => void;
}

export function EmployeeCard({ employee, onViewProfile }: EmployeeCardProps) {
  return (
    <div className="relative flex flex-col items-center gap-3 rounded-xl border border-border bg-surface-card p-5 text-center transition-shadow hover:shadow-md">
      <span className="absolute right-3 top-3">
        <StatusBadge status={EMPLOYMENT_STATUS_LABELS[employee.status]} />
      </span>

      <Avatar name={employee.name} imageUrl={employee.avatarUrl} size="lg" className="mt-2" />

      <div>
        <p className="text-fs-xl font-semibold text-ink">{employee.name}</p>
        <p className="text-fs-base text-muted">{employee.designation || "—"}</p>
      </div>

      <EmployeeMeta department={employee.department || "—"} location={employee.location} />

      {employee.skills.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {employee.skills.slice(0, 3).map((skill) => (
            <Badge key={skill} tone="neutral">
              {skill}
            </Badge>
          ))}
        </div>
      )}

      <Button variant="secondary" size="sm" className="w-full" onClick={() => onViewProfile(employee)}>
        View Profile
      </Button>
    </div>
  );
}
