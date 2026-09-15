"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { FormField } from "@/components/molecules/FormField";
import { FileUploadField } from "@/components/molecules/FileUploadField";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { Radio } from "@/components/atoms/Radio";
import { basicInfoSchema } from "@/schemas/onboarding.schema";
import { checkEmailExists } from "@/services/onboarding.service";
import { uploadOnboardingAsset } from "@/services/onboarding-asset.service";
import { GENDER_LABELS, GENDERS, type BasicInfo, type Gender } from "@/types/onboarding";
import type { OnboardingStepHandle } from "@/components/organisms/onboarding/step-types";

export interface BasicInfoStepProps {
  value: BasicInfo;
  onChange: (value: BasicInfo) => void;
  recordId: string;
}

export const BasicInfoStep = forwardRef<OnboardingStepHandle, BasicInfoStepProps>(function BasicInfoStep(
  { value, onChange, recordId },
  ref
) {
  const [errors, setErrors] = useState<Partial<Record<keyof BasicInfo, string>>>({});
  const [emailCheck, setEmailCheck] = useState<"idle" | "checking" | "available" | "conflict">("idle");

  useImperativeHandle(ref, () => ({
    validate: () => {
      const result = basicInfoSchema.safeParse(value);
      const nextErrors: Partial<Record<keyof BasicInfo, string>> = {};
      if (!result.success) {
        for (const issue of result.error.issues) {
          const field = issue.path[0] as keyof BasicInfo;
          if (!nextErrors[field]) nextErrors[field] = issue.message;
        }
      }
      if (emailCheck === "conflict") {
        nextErrors.email = "This email is already registered to another account.";
      }
      setErrors(nextErrors);
      return Object.keys(nextErrors).length === 0;
    },
  }));

  function update<K extends keyof BasicInfo>(key: K, next: BasicInfo[K]) {
    onChange({ ...value, [key]: next });
  }

  async function handleEmailBlur() {
    const parsed = basicInfoSchema.shape.email.safeParse(value.email);
    if (!parsed.success) return;

    setEmailCheck("checking");
    const result = await checkEmailExists(value.email, recordId);
    setEmailCheck(result.exists ? "conflict" : "available");
    setErrors((prev) => ({
      ...prev,
      email: result.exists ? "Email already registered" : undefined,
    }));
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-fs-3xl font-semibold text-ink">Basic Information</h2>
        <p className="mt-1 text-fs-base text-muted">
          Start with the candidate&apos;s personal details. Email is collected here — it becomes the account&apos;s
          login.
        </p>
      </div>

      <FileUploadField
        label="Profile Picture (optional)"
        imagePreview
        accept="image/png,image/jpeg,image/webp"
        maxSizeMb={2}
        hint="PNG, JPG or WEBP up to 2MB."
        value={
          value.profilePictureName
            ? { fileName: value.profilePictureName, previewUrl: value.profilePictureUrl }
            : undefined
        }
        onUpload={(file) => uploadOnboardingAsset(file, "profilePicture")}
        onChange={(file) =>
          onChange({
            ...value,
            profilePictureName: file?.fileName,
            profilePictureUrl: file?.url ?? file?.previewUrl,
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
        <FormField label="Email Address" htmlFor="email" required error={errors.email}>
          <div className="relative">
            <Input
              id="email"
              type="email"
              value={value.email}
              onChange={(e) => {
                update("email", e.target.value);
                setEmailCheck("idle");
              }}
              onBlur={handleEmailBlur}
              invalid={Boolean(errors.email)}
              placeholder="name@hikeassociate.com"
              className="pr-9"
            />
            {emailCheck === "checking" && (
              <Loader2 className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-light" />
            )}
            {emailCheck === "available" && (
              <CheckCircle2 className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-success" />
            )}
            {emailCheck === "conflict" && (
              <AlertTriangle className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-danger" />
            )}
          </div>
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
                <Label className="font-normal">{GENDER_LABELS[gender]}</Label>
              </label>
            ))}
          </div>
        </FormField>
      </div>
    </div>
  );
});
