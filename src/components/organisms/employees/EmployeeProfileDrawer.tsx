"use client";

import { useState } from "react";
import { Mail, Phone, Building2, MapPin, CalendarDays, BadgeCheck, Power } from "lucide-react";
import { Drawer } from "@/components/molecules/Drawer";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { ConfirmModal } from "@/components/molecules/ConfirmModal";
import { EMPLOYMENT_STATUS_LABELS, type Employee } from "@/types/employee";

export interface EmployeeProfileDrawerProps {
  employee: Employee | null;
  onClose: () => void;
  onUpdateStatus: (employee: Employee, nextStatus: "active" | "inactive") => Promise<void>;
  canUpdateStatus: boolean;
}

export function EmployeeProfileDrawer({ employee, onClose, onUpdateStatus, canUpdateStatus }: EmployeeProfileDrawerProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const nextStatus: "active" | "inactive" = employee?.status === "active" ? "inactive" : "active";

  async function handleConfirm() {
    if (!employee) return;
    setIsUpdating(true);
    try {
      await onUpdateStatus(employee, nextStatus);
      setConfirmOpen(false);
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <Drawer open={Boolean(employee)} onClose={onClose} title="Employee Profile">
      {employee && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-2 text-center">
            <Avatar name={employee.name} imageUrl={employee.avatarUrl} size="lg" />
            <div>
              <p className="text-fs-2xl font-semibold text-ink">{employee.name}</p>
              <p className="text-fs-base text-muted">{employee.designation || "—"}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={EMPLOYMENT_STATUS_LABELS[employee.status]} />
              {employee.employeeId && <Badge tone="neutral">{employee.employeeId}</Badge>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 rounded-lg border border-border p-3 text-fs-base sm:grid-cols-2">
            <div className="flex items-center gap-2 text-muted">
              <Building2 className="size-4 shrink-0" />
              {employee.department || "—"}
            </div>
            {employee.location && (
              <div className="flex items-center gap-2 text-muted">
                <MapPin className="size-4 shrink-0" />
                {employee.location}
              </div>
            )}
            <div className="flex items-center gap-2 text-muted">
              <Mail className="size-4 shrink-0" />
              <span className="truncate">{employee.email || "—"}</span>
            </div>
            {employee.phone && (
              <div className="flex items-center gap-2 text-muted">
                <Phone className="size-4 shrink-0" />
                {employee.phone}
              </div>
            )}
            {employee.joinedDate && (
              <div className="flex items-center gap-2 text-muted">
                <CalendarDays className="size-4 shrink-0" />
                Joined {new Date(employee.joinedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </div>
            )}
            {employee.manager && (
              <div className="flex items-center gap-2 text-muted">
                <BadgeCheck className="size-4 shrink-0" />
                Reports to {employee.manager}
              </div>
            )}
          </div>

          {employee.skills.length > 0 && (
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
          )}

          {canUpdateStatus && (employee.status === "active" || employee.status === "inactive") && (
            <Button
              variant={nextStatus === "inactive" ? "danger" : "primary"}
              size="sm"
              onClick={() => setConfirmOpen(true)}
            >
              <Power className="size-3.5" />
              {nextStatus === "inactive" ? "Deactivate Employee" : "Activate Employee"}
            </Button>
          )}
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        title={nextStatus === "inactive" ? "Deactivate Employee" : "Activate Employee"}
        description={employee?.name}
        body={
          nextStatus === "inactive"
            ? "This deactivates the employee's account — they will no longer be able to sign in."
            : "This reactivates the employee's account and restores sign-in access."
        }
        confirmLabel={nextStatus === "inactive" ? "Deactivate" : "Activate"}
        tone={nextStatus === "inactive" ? "danger" : "default"}
        isConfirming={isUpdating}
      />
    </Drawer>
  );
}
