"use client";

import { forwardRef, useImperativeHandle } from "react";
import { Pencil } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Checkbox } from "@/components/atoms/Checkbox";
import { Label } from "@/components/atoms/Label";
import { Button } from "@/components/atoms/Button";
import { useRoles } from "@/hooks/use-roles";
import { employeeFullName, GENDER_LABELS, ONBOARDING_STEP_KEYS, type OnboardingRecord } from "@/types/onboarding";
import type { OnboardingStepHandle } from "@/components/organisms/onboarding/step-types";

export interface ReviewStepProps {
  record: OnboardingRecord;
  onEditStep: (index: number) => void;
  onConfirmChange: (confirmed: boolean) => void;
  /** Hides the confirmation checkbox — used when reviewing an already-submitted record. */
  hideConfirmation?: boolean;
}

const STATUS_TONE = { PENDING: "warning", VERIFIED: "success", REJECTED: "danger" } as const;

function SectionCard({
  title,
  stepKey,
  onEdit,
  children,
}: {
  title: string;
  stepKey: (typeof ONBOARDING_STEP_KEYS)[number];
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-card p-4" data-step={stepKey}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-fs-xl font-semibold text-ink">{title}</h3>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="size-3.5" />
          Edit
        </Button>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-fs-sm text-muted-light">{label}</p>
      <p className="text-fs-base text-ink">{value?.trim() ? value : "—"}</p>
    </div>
  );
}

export const ReviewStep = forwardRef<OnboardingStepHandle, ReviewStepProps>(function ReviewStep(
  { record, onEditStep, onConfirmChange, hideConfirmation },
  ref
) {
  const { getRoleLabel } = useRoles();

  useImperativeHandle(ref, () => ({
    validate: () => record.confirmedAccurate,
  }));

  const stepIndex = (key: (typeof ONBOARDING_STEP_KEYS)[number]) => ONBOARDING_STEP_KEYS.indexOf(key);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-fs-3xl font-semibold text-ink">Review Employee Information</h2>
        <p className="mt-1 text-fs-base text-muted">
          Confirm every section is correct. Use Edit to jump straight to a section instead of stepping through
          the whole wizard again.
        </p>
      </div>

      <SectionCard title="Basic Information" stepKey="basicInfo" onEdit={() => onEditStep(stepIndex("basicInfo"))}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Full Name" value={employeeFullName(record.basicInfo)} />
          <Field label="Email" value={record.basicInfo.email} />
          <Field label="Date of Birth" value={record.basicInfo.dateOfBirth} />
          <Field label="Gender" value={record.basicInfo.gender ? GENDER_LABELS[record.basicInfo.gender] : undefined} />
        </div>
      </SectionCard>

      <SectionCard title="Contact Information" stepKey="contactInfo" onEdit={() => onEditStep(stepIndex("contactInfo"))}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Mobile" value={record.contactInfo.mobile} />
          <Field label="City" value={record.contactInfo.city} />
          <Field label="State" value={record.contactInfo.state} />
          <Field label="Pincode" value={record.contactInfo.pincode} />
        </div>
      </SectionCard>

      <SectionCard
        title="Professional Information"
        stepKey="professionalInfo"
        onEdit={() => onEditStep(stepIndex("professionalInfo"))}
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Department" value={record.professionalInfo.department} />
          <Field label="Designation" value={record.professionalInfo.designation} />
          <Field label="Joining Date" value={record.professionalInfo.joiningDate} />
          <Field label="Employment Type" value={record.professionalInfo.employmentType} />
        </div>
      </SectionCard>

      <SectionCard title="Role & Access" stepKey="roleAccess" onEdit={() => onEditStep(stepIndex("roleAccess"))}>
        <Field label="Assigned Role" value={getRoleLabel(record.roleAccess.role)} />
      </SectionCard>

      <SectionCard title="Technology & Skills" stepKey="technology" onEdit={() => onEditStep(stepIndex("technology"))}>
        {record.technology.technologies.length === 0 ? (
          <p className="text-fs-base text-muted-light">No technologies selected.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {record.technology.technologies.map((tech) => (
              <Badge key={tech} tone="primary">
                {tech}
              </Badge>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Qualification" stepKey="qualification" onEdit={() => onEditStep(stepIndex("qualification"))}>
        {record.qualifications.length === 0 ? (
          <p className="text-fs-base text-muted-light">No qualifications added.</p>
        ) : (
          <ul className="flex flex-col gap-1.5 text-fs-base text-ink">
            {record.qualifications.map((q) => (
              <li key={q.id}>
                {q.boardOrDegree || q.type} — {q.institution} ({q.startYear}–{q.endYear})
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard
        title="Emergency Contacts"
        stepKey="emergencyContacts"
        onEdit={() => onEditStep(stepIndex("emergencyContacts"))}
      >
        {record.emergencyContacts.length === 0 ? (
          <p className="text-fs-base text-danger">No emergency contact added.</p>
        ) : (
          <ul className="flex flex-col gap-1.5 text-fs-base text-ink">
            {record.emergencyContacts.map((c) => (
              <li key={c.id}>
                {c.name} ({c.relationship}) — {c.mobile} {c.isPrimary && <Badge tone="primary">Primary</Badge>}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Documents" stepKey="documents" onEdit={() => onEditStep(stepIndex("documents"))}>
        <ul className="flex flex-col gap-1.5">
          {record.documents.map((doc) => (
            <li key={doc.key} className="flex items-center justify-between text-fs-base text-ink">
              <span>
                {doc.name} {doc.required && <span className="text-fs-sm text-muted-light">(Required)</span>}
              </span>
              {doc.fileName ? (
                <Badge tone={STATUS_TONE[doc.status]}>{doc.status}</Badge>
              ) : (
                <Badge tone="neutral">Not uploaded</Badge>
              )}
            </li>
          ))}
        </ul>
      </SectionCard>

      {!hideConfirmation && (
        <div className="flex items-start gap-2 rounded-xl border border-border bg-surface-card p-4">
          <Checkbox
            id="confirmAccurate"
            checked={record.confirmedAccurate}
            onChange={(e) => onConfirmChange(e.target.checked)}
            className="mt-0.5"
          />
          <Label htmlFor="confirmAccurate" className="font-normal text-ink">
            I confirm that the information provided is correct.
          </Label>
        </div>
      )}
    </div>
  );
});
