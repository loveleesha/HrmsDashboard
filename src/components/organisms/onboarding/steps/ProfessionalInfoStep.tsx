"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { FormField } from "@/components/molecules/FormField";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { Input } from "@/components/atoms/Input";
import { professionalInfoSchema } from "@/schemas/onboarding.schema";
import { useDepartments } from "@/hooks/use-departments";
import { getEmployees } from "@/services/employee.service";
import { EMPLOYMENT_TYPES, type EmploymentType, type ProfessionalInfo } from "@/types/onboarding";
import type { OnboardingStepHandle } from "@/components/organisms/onboarding/step-types";
import { DatePicker } from "@/components/molecules/DatePicker";

export interface ProfessionalInfoStepProps {
  value: ProfessionalInfo;
  onChange: (value: ProfessionalInfo) => void;
  /** Excludes this employee (by their account/userId) from their own
   * "Reporting Manager" options — only meaningful in edit mode, where the
   * record being edited is itself a real employee who could otherwise
   * appear as a candidate manager for themselves. */
  excludeUserId?: string;
}

export const ProfessionalInfoStep = forwardRef<OnboardingStepHandle, ProfessionalInfoStepProps>(
  function ProfessionalInfoStep({ value, onChange, excludeUserId }, ref) {
    const [errors, setErrors] = useState<Partial<Record<keyof ProfessionalInfo, string>>>({});
    const { departments } = useDepartments();
    // Reporting Manager options are restricted to employees whose account role
    // is "manager" — the same role this app's Project & Team Hierarchy treats
    // as a manager (see types/hierarchy.ts's MANAGER_ROLE), so every selection
    // here is guaranteed to resolve to a real manager node in that tree.
    const [managers, setManagers] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => {
      let isMounted = true;
      getEmployees().then((employees) => {
        if (!isMounted) return;
        setManagers(
          employees
            .filter((employee) => employee.role === "manager" && employee.id !== excludeUserId)
            .map((employee) => ({ id: employee.employeeRecordId ?? "", name: employee.name }))
            .filter((option) => option.id)
        );
      });
      return () => {
        isMounted = false;
      };
    }, [excludeUserId]);

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
            <DatePicker
              id="joiningDate"
              value={value.joiningDate}
              onChange={(next) => update("joiningDate", next)}
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
            <FilterDropdown
              label="Select Manager"
              ariaLabel="Reporting Manager"
              options={managers.map((manager) => ({ label: manager.name, value: manager.id }))}
              value={value.reportingManager ?? ""}
              onChange={(v) => update("reportingManager", v)}
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
