import { Mail, Phone, MapPin, Building2, CalendarDays, BadgeCheck } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import type { Employee } from "@/types/employee";

export function BasicInfoTab({ employee }: { employee: Employee }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-surface-card p-5">
        <h3 className="mb-3 text-fs-xl font-semibold text-ink">Contact Details</h3>
        <div className="flex flex-col gap-3 text-fs-base">
          <div className="flex items-center gap-2 text-muted">
            <Mail className="size-4 shrink-0" />
            {employee.email}
          </div>
          <div className="flex items-center gap-2 text-muted">
            <Phone className="size-4 shrink-0" />
            {employee.phone}
          </div>
          <div className="flex items-center gap-2 text-muted">
            <MapPin className="size-4 shrink-0" />
            {employee.city} · {employee.workLocationType}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-card p-5">
        <h3 className="mb-3 text-fs-xl font-semibold text-ink">Employment Details</h3>
        <div className="flex flex-col gap-3 text-fs-base">
          <div className="flex items-center gap-2 text-muted">
            <Building2 className="size-4 shrink-0" />
            {employee.department} · {employee.level}
          </div>
          <div className="flex items-center gap-2 text-muted">
            <CalendarDays className="size-4 shrink-0" />
            Joined{" "}
            {new Date(employee.joinedDate).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </div>
          {employee.manager && (
            <div className="flex items-center gap-2 text-muted">
              <BadgeCheck className="size-4 shrink-0" />
              Reports to {employee.manager}
            </div>
          )}
          <div className="flex items-center gap-2">
            <StatusBadge status={employee.status} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-card p-5 lg:col-span-2">
        <h3 className="mb-3 text-fs-xl font-semibold text-ink">Skills</h3>
        <div className="flex flex-wrap gap-1.5">
          {employee.skills.map((skill) => (
            <Badge key={skill} tone="neutral">
              {skill}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
