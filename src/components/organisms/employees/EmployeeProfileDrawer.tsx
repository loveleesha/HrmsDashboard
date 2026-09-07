import {
  Mail,
  Phone,
  Building2,
  MapPin,
  CalendarDays,
  BadgeCheck,
  Award,
} from "lucide-react";
import { Drawer } from "@/components/molecules/Drawer";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { Meter } from "@/components/molecules/Meter";
import { getPerformanceLabel, PERFORMANCE_BAR_COLOR, PERFORMANCE_TEXT_COLOR } from "@/lib/performance";
import type { Employee } from "@/types/employee";
import { cn } from "@/lib/cn";

const RECENT_ACTIVITY = [
  "Submitted timesheet for last week",
  "Completed \"Q3 Security Training\" module",
  "Received a Team Player recognition",
];

export interface EmployeeProfileDrawerProps {
  employee: Employee | null;
  onClose: () => void;
}

export function EmployeeProfileDrawer({ employee, onClose }: EmployeeProfileDrawerProps) {
  const label = employee ? getPerformanceLabel(employee.performanceScore) : "Average";

  return (
    <Drawer open={Boolean(employee)} onClose={onClose} title="Employee Profile">
      {employee && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-2 text-center">
            <Avatar name={employee.name} imageUrl={employee.avatarUrl} size="lg" />
            <div>
              <p className="text-fs-2xl font-semibold text-ink">{employee.name}</p>
              <p className="text-fs-base text-muted">{employee.designation}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={employee.status} />
              <Badge tone="neutral">{employee.id}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 rounded-lg border border-border p-3 text-fs-base sm:grid-cols-2">
            <div className="flex items-center gap-2 text-muted">
              <Building2 className="size-4 shrink-0" />
              {employee.department}
            </div>
            <div className="flex items-center gap-2 text-muted">
              <MapPin className="size-4 shrink-0" />
              {employee.city} · {employee.workLocationType}
            </div>
            <div className="flex items-center gap-2 text-muted">
              <Mail className="size-4 shrink-0" />
              <span className="truncate">{employee.email}</span>
            </div>
            <div className="flex items-center gap-2 text-muted">
              <Phone className="size-4 shrink-0" />
              {employee.phone}
            </div>
            <div className="flex items-center gap-2 text-muted">
              <CalendarDays className="size-4 shrink-0" />
              Joined {new Date(employee.joinedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </div>
            {employee.manager && (
              <div className="flex items-center gap-2 text-muted">
                <BadgeCheck className="size-4 shrink-0" />
                Reports to {employee.manager}
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-fs-base font-semibold text-ink">Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {employee.skills.map((skill) => (
                <Badge key={skill} tone="neutral">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border p-3">
            <div className="mb-1.5 flex items-center justify-between text-fs-base">
              <span className="font-semibold text-ink">Performance</span>
              <span className={cn("font-semibold", PERFORMANCE_TEXT_COLOR[label])}>{label}</span>
            </div>
            <Meter value={employee.performanceScore} colorClassName={PERFORMANCE_BAR_COLOR[label]} />
            <p className="mt-1 text-right text-fs-sm text-muted">{employee.performanceScore}%</p>
          </div>

          <div>
            <p className="mb-2 flex items-center gap-1.5 text-fs-base font-semibold text-ink">
              <Award className="size-4 text-primary" />
              Recognition Badges
            </p>
            {employee.badges.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {employee.badges.map((badge) => (
                  <Badge key={badge} tone="primary">
                    {badge}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-fs-base text-muted">No recognitions yet.</p>
            )}
          </div>

          <div className="rounded-lg border border-border p-3">
            <p className="mb-2 text-fs-base font-semibold text-ink">Attendance Summary</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-fs-2xl font-semibold text-success">21</p>
                <p className="text-fs-sm text-muted">Present</p>
              </div>
              <div>
                <p className="text-fs-2xl font-semibold text-warning">3</p>
                <p className="text-fs-sm text-muted">Leave</p>
              </div>
              <div>
                <p className="text-fs-2xl font-semibold text-ink">92.5%</p>
                <p className="text-fs-sm text-muted">Rate</p>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-fs-base font-semibold text-ink">Recent Activity</p>
            <ul className="flex flex-col gap-2">
              {RECENT_ACTIVITY.map((activity) => (
                <li key={activity} className="flex items-start gap-2 text-fs-base text-muted">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  {activity}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Drawer>
  );
}
