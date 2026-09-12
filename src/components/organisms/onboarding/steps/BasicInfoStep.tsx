"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { FormField } from "@/components/molecules/FormField";
import { FileUploadField } from "@/components/molecules/FileUploadField";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { Radio } from "@/components/atoms/Radio";
import { basicInfoSchema } from "@/schemas/onboarding.schema";
import { GENDERS, type BasicInfo, type Gender } from "@/types/onboarding";
import type { OnboardingStepHandle } from "@/components/organisms/onboarding/step-types";

export interface BasicInfoStepProps {
  value: BasicInfo;
  onChange: (value: BasicInfo) => void;
}

export const BasicInfoStep = forwardRef<OnboardingStepHandle, BasicInfoStepProps>(function BasicInfoStep(
  { value, onChange },
  ref
) {
  const [errors, setErrors] = useState<Partial<Record<keyof BasicInfo, string>>>({});

  useImperativeHandle(ref, () => ({
    validate: () => {
      const result = basicInfoSchema.safeParse(value);
      if (result.success) {
        setErrors({});
        return true;
      }
      const nextErrors: Partial<Record<keyof BasicInfo, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof BasicInfo;
        if (!nextErrors[field]) nextErrors[field] = issue.message;
      }
      setErrors(nextErrors);
      return false;
    },
  }));

  function update<K extends keyof BasicInfo>(key: K, next: BasicInfo[K]) {
    onChange({ ...value, [key]: next });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-fs-3xl font-semibold text-ink">Basic Information</h2>
        <p className="mt-1 text-fs-base text-muted">Start with the candidate&apos;s personal details.</p>
      </div>

      <FileUploadField
        label="Profile Picture"
        imagePreview
        accept="image/png,image/jpeg,image/webp"
        maxSizeMb={2}
        hint="PNG, JPG or WEBP up to 2MB."
        value={
          value.profilePictureName
            ? { fileName: value.profilePictureName, previewUrl: value.profilePictureUrl }
            : undefined
        }
        onChange={(file) =>
          onChange({
            ...value,
            profilePictureName: file?.fileName,
            profilePictureUrl: file?.previewUrl,
          })
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="First Name" htmlFor="firstName" required error={errors.firstName}>
          <Input
            id="firstName"
            value={value.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            invalid={Boolean(errors.firstName)}
            placeholder="e.g. Aarav"
          />
        </FormField>
        <FormField label="Last Name" htmlFor="lastName" required error={errors.lastName}>
          <Input
            id="lastName"
            value={value.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            invalid={Boolean(errors.lastName)}
            placeholder="e.g. Sharma"
          />
        </FormField>
        <FormField label="Date of Birth" htmlFor="dateOfBirth" required error={errors.dateOfBirth}>
          <Input
            id="dateOfBirth"
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            value={value.dateOfBirth}
            onChange={(e) => update("dateOfBirth", e.target.value)}
            invalid={Boolean(errors.dateOfBirth)}
          />
        </FormField>
        <FormField label="Gender" htmlFor="gender" required error={errors.gender}>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            {GENDERS.map((gender) => (
              <label key={gender} className="flex items-center gap-2">
                <Radio
                  name="gender"
                  checked={value.gender === gender}
                  onChange={() => update("gender", gender as Gender)}
                />
                <Label className="font-normal">{gender}</Label>
              </label>
            ))}
          </div>
        </FormField>
      </div>
    </div>
  );
});
