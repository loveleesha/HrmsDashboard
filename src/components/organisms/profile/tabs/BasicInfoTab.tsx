import { useState } from "react";
import { Mail, Phone, MapPin, Building2, CalendarDays, BadgeCheck, Cake, VenusAndMars, ShieldCheck, FileText, Download, Pencil } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { EditBasicInfoDrawer } from "@/components/organisms/profile/EditBasicInfoDrawer";
import { EditAdminProfileDrawer } from "@/components/organisms/profile/EditAdminProfileDrawer";
import { useRoles } from "@/hooks/use-roles";
import { EMPLOYMENT_STATUS_LABELS } from "@/types/employee";
import { GENDER_LABELS, type Gender } from "@/types/onboarding";
import type { MyProfile } from "@/types/profile";

export interface BasicInfoTabProps {
  employee: MyProfile;
  onProfileUpdated?: (profile: MyProfile) => void;
}

export function BasicInfoTab({ employee, onProfileUpdated }: BasicInfoTabProps) {
  const { getRoleLabel } = useRoles();
  const [editOpen, setEditOpen] = useState(false);
  const address = employee.address;
  const addressLine = [address?.addressLine, address?.city, address?.state, address?.pincode]
    .filter(Boolean)
    .join(", ");

  // Admin-tier accounts (profileType: "admin") have no Employee record behind
  // them — no department/designation/skills/documents/emergency contacts to
  // show. Editing goes through PATCH /api/admin/profile (name + mobile only),
  // a different endpoint from updateMyProfile's employee-shape "basic_detail".
  if (employee.profileType === "admin") {
    return (
      <div className="rounded-xl border border-border bg-surface-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-fs-xl font-semibold text-ink">Contact Details</h3>
          <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="size-3.5" />
            Edit
          </Button>
        </div>
        <div className="flex flex-col gap-3 text-fs-base">
          <div className="flex items-center gap-2 text-muted">
            <Mail className="size-4 shrink-0" />
            {employee.email}
          </div>
          <div className="flex items-center gap-2 text-muted">
            <Phone className="size-4 shrink-0" />
            {employee.phone || "—"}
          </div>
        </div>

        <EditAdminProfileDrawer
          open={editOpen}
          onClose={() => setEditOpen(false)}
          profile={employee}
          onSaved={(updated) => onProfileUpdated?.(updated)}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-surface-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-fs-xl font-semibold text-ink">Contact Details</h3>
          <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="size-3.5" />
            Edit
          </Button>
        </div>
        <div className="flex flex-col gap-3 text-fs-base">
          <div className="flex items-center gap-2 text-muted">
            <Mail className="size-4 shrink-0" />
            {employee.email}
          </div>
          <div className="flex items-center gap-2 text-muted">
            <Phone className="size-4 shrink-0" />
            {employee.phone || "—"}
          </div>
          <div className="flex items-center gap-2 text-muted">
            <MapPin className="size-4 shrink-0" />
            {addressLine || employee.location || "—"}
          </div>
          {employee.dateOfBirth && (
            <div className="flex items-center gap-2 text-muted">
              <Cake className="size-4 shrink-0" />
              {new Date(employee.dateOfBirth).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </div>
          )}
          {employee.gender && (
            <div className="flex items-center gap-2 text-muted">
              <VenusAndMars className="size-4 shrink-0" />
              {GENDER_LABELS[employee.gender as Gender] ?? employee.gender}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-card p-5">
        <h3 className="mb-3 text-fs-xl font-semibold text-ink">Employment Details</h3>
        <div className="flex flex-col gap-3 text-fs-base">
          <div className="flex items-center gap-2 text-muted">
            <Building2 className="size-4 shrink-0" />
            {employee.department} {employee.designation && `· ${employee.designation}`}
          </div>
          {employee.role && (
            <div className="flex items-center gap-2 text-muted">
              <ShieldCheck className="size-4 shrink-0" />
              {employee.roleLabel ?? getRoleLabel(employee.role)}
            </div>
          )}
          {employee.joinedDate && (
            <div className="flex items-center gap-2 text-muted">
              <CalendarDays className="size-4 shrink-0" />
              Joined{" "}
              {new Date(employee.joinedDate).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </div>
          )}
          {employee.manager && (
            <div className="flex items-center gap-2 text-muted">
              <BadgeCheck className="size-4 shrink-0" />
              Reports to {employee.manager}
            </div>
          )}
          <div className="flex items-center gap-2">
            <StatusBadge status={EMPLOYMENT_STATUS_LABELS[employee.status]} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-card p-5 lg:col-span-2">
        <h3 className="mb-3 text-fs-xl font-semibold text-ink">Skills</h3>
        <div className="flex flex-wrap gap-1.5">
          {employee.skills.length > 0 ? (
            employee.skills.map((skill) => (
              <Badge key={skill} tone="neutral">
                {skill}
              </Badge>
            ))
          ) : (
            <p className="text-fs-base text-muted">No skills on file.</p>
          )}
        </div>
      </div>

      {employee.emergencyContacts.length > 0 && (
        <div className="rounded-xl border border-border bg-surface-card p-5 lg:col-span-2">
          <h3 className="mb-3 text-fs-xl font-semibold text-ink">Emergency Contacts</h3>
          <div className="flex flex-col gap-3">
            {employee.emergencyContacts.map((contact) => (
              <div key={contact.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2">
                <div>
                  <p className="text-fs-base font-medium text-ink">
                    {contact.name} <span className="font-normal text-muted">· {contact.relationship}</span>
                  </p>
                  <p className="text-fs-sm text-muted">{contact.mobile}</p>
                </div>
                {contact.isPrimary && <Badge tone="primary">Primary</Badge>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface-card p-5 lg:col-span-2">
        <h3 className="mb-3 text-fs-xl font-semibold text-ink">Documents on File</h3>
        {employee.documents.length === 0 ? (
          <p className="text-fs-base text-muted">No documents on file.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {employee.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-fs-base text-ink">
                    <FileText className="size-4 shrink-0 text-muted-light" />
                    <span className="truncate">{doc.name}</span>
                  </p>
                  {doc.verificationStatus && (
                    <div className="mt-1">
                      <StatusBadge status={doc.verificationStatus} />
                    </div>
                  )}
                </div>
                {doc.fileUrl ? (
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex shrink-0 items-center gap-1 text-fs-sm text-primary hover:underline"
                  >
                    <Download className="size-3.5" />
                    View
                  </a>
                ) : (
                  <span className="text-fs-sm text-muted-light">No file</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <EditBasicInfoDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        profile={employee}
        onSaved={(updated) => onProfileUpdated?.(updated)}
      />
    </div>
  );
}
