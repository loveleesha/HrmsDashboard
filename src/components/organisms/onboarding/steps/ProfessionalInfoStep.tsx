"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { FormField } from "@/components/molecules/FormField";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { Input } from "@/components/atoms/Input";
import { professionalInfoSchema } from "@/schemas/onboarding.schema";
import { useDepartments } from "@/hooks/use-departments";
import { EMPLOYMENT_TYPES, type EmploymentType, type ProfessionalInfo } from "@/types/onboarding";
import type { OnboardingStepHandle } from "@/components/organisms/onboarding/step-types";

export interface ProfessionalInfoStepProps {
  value: ProfessionalInfo;
  onChange: (value: ProfessionalInfo) => void;
}

export const ProfessionalInfoStep = forwardRef<OnboardingStepHandle, ProfessionalInfoStepProps>(
  function ProfessionalInfoStep({ value, onChange }, ref) {
    const [errors, setErrors] = useState<Partial<Record<keyof ProfessionalInfo, string>>>({});
    const { departments } = useDepartments();

    useImperativeHandle(ref, () => ({
      validate: () => {
        const result = professionalInfoSchema.safeParse(value);
        if (result.success) {
          setErrors({});
          return true;
        }
        const nextErrors: Partial<Record<keyof ProfessionalInfo, string>> = {};
        for (const issue of result.error.issues) {
          const field = issue.path[0] as keyof ProfessionalInfo;
          if (!nextErrors[field]) nextErrors[field] = issue.message;
        }
        setErrors(nextErrors);
        return false;
      },
    }));

    function update<K extends keyof ProfessionalInfo>(key: K, next: ProfessionalInfo[K]) {
      onChange({ ...value, [key]: next });
    }

    return (
      <div className="flex flex-col gap-5">
        <div>
          <h2 className="text-fs-3xl font-semibold text-ink">Professional Information</h2>
          <p className="mt-1 text-fs-base text-muted">
            The Employee ID is system-generated later and cannot be entered manually.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Department" htmlFor="department" required error={errors.department}>
            <FilterDropdown
              label="Select Department"
              options={departments.map((d) => ({ label: d.name, value: d.name }))}
              value={value.department}
              onChange={(v) => update("department", v)}
            />
          </FormField>
          <FormField label="Designation" htmlFor="designation" required error={errors.designation}>
            <Input
              id="designation"
              value={value.designation}
              onChange={(e) => update("designation", e.target.value)}
              invalid={Boolean(errors.designation)}
              placeholder="e.g. Software Engineer"
            />
          </FormField>
          <FormField label="Joining Date" htmlFor="joiningDate" required error={errors.joiningDate}>
            <Input
              id="joiningDate"
              type="date"
              value={value.joiningDate}
              onChange={(e) => update("joiningDate", e.target.value)}
              invalid={Boolean(errors.joiningDate)}
            />
          </FormField>
          <FormField label="Employment Type" htmlFor="employmentType" error={errors.employmentType}>
            <FilterDropdown
              label="Select Type"
              options={EMPLOYMENT_TYPES.map((t) => ({ label: t, value: t }))}
              value={value.employmentType ?? ""}
              onChange={(v) => update("employmentType", v as EmploymentType)}
            />
          </FormField>
          <FormField label="Reporting Manager" htmlFor="reportingManager" error={errors.reportingManager}>
            <Input
              id="reportingManager"
              value={value.reportingManager ?? ""}
              onChange={(e) => update("reportingManager", e.target.value)}
              placeholder="e.g. Karan Malhotra"
            />
          </FormField>
          <FormField label="Work Location" htmlFor="workLocation" error={errors.workLocation}>
            <Input
              id="workLocation"
              value={value.workLocation ?? ""}
              onChange={(e) => update("workLocation", e.target.value)}
              placeholder="e.g. Delhi Office"
            />
          </FormField>
          <FormField label="Experience" htmlFor="experience" error={errors.experience}>
            <Input
              id="experience"
              value={value.experience ?? ""}
              onChange={(e) => update("experience", e.target.value)}
              placeholder="e.g. 3 years"
            />
          </FormField>
          <FormField label="Previous Company" htmlFor="previousCompany" error={errors.previousCompany}>
            <Input
              id="previousCompany"
              value={value.previousCompany ?? ""}
              onChange={(e) => update("previousCompany", e.target.value)}
            />
          </FormField>
        </div>
      </div>
    );
  }
);
