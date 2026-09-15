"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { FormField } from "@/components/molecules/FormField";
import { Input } from "@/components/atoms/Input";
import { contactInfoSchema } from "@/schemas/onboarding.schema";
import type { ContactInfo } from "@/types/onboarding";
import type { OnboardingStepHandle } from "@/components/organisms/onboarding/step-types";

export interface ContactInfoStepProps {
  value: ContactInfo;
  onChange: (value: ContactInfo) => void;
}

export const ContactInfoStep = forwardRef<OnboardingStepHandle, ContactInfoStepProps>(function ContactInfoStep(
  { value, onChange },
  ref
) {
  const [errors, setErrors] = useState<Partial<Record<keyof ContactInfo, string>>>({});

  useImperativeHandle(ref, () => ({
    validate: () => {
      const result = contactInfoSchema.safeParse(value);
      if (result.success) {
        setErrors({});
        return true;
      }
      const nextErrors: Partial<Record<keyof ContactInfo, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ContactInfo;
        if (!nextErrors[field]) nextErrors[field] = issue.message;
      }
      setErrors(nextErrors);
      return false;
    },
  }));

  function update<K extends keyof ContactInfo>(key: K, next: ContactInfo[K]) {
    onChange({ ...value, [key]: next });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-fs-3xl font-semibold text-ink">Contact Information</h2>
        <p className="mt-1 text-fs-base text-muted">Mobile number and address — profile information only.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Mobile Number" htmlFor="mobile" required error={errors.mobile} hint="Profile information only — not used for login.">
          <Input
            id="mobile"
            type="tel"
            value={value.mobile}
            onChange={(e) => update("mobile", e.target.value)}
            invalid={Boolean(errors.mobile)}
            placeholder="+91 98100 11234"
          />
        </FormField>
        <FormField label="Alternate Mobile Number" htmlFor="alternateMobile" error={errors.alternateMobile}>
          <Input
            id="alternateMobile"
            type="tel"
            value={value.alternateMobile ?? ""}
            onChange={(e) => update("alternateMobile", e.target.value)}
            invalid={Boolean(errors.alternateMobile)}
          />
        </FormField>
        <FormField label="City" htmlFor="city" error={errors.city}>
          <Input id="city" value={value.city ?? ""} onChange={(e) => update("city", e.target.value)} />
        </FormField>
        <FormField label="State" htmlFor="state" error={errors.state}>
          <Input id="state" value={value.state ?? ""} onChange={(e) => update("state", e.target.value)} />
        </FormField>
        <FormField label="Pincode" htmlFor="pincode" error={errors.pincode}>
          <Input
            id="pincode"
            value={value.pincode ?? ""}
            onChange={(e) => update("pincode", e.target.value)}
            invalid={Boolean(errors.pincode)}
          />
        </FormField>
        <FormField label="Address" htmlFor="address" className="sm:col-span-2" error={errors.address}>
          <Input id="address" value={value.address ?? ""} onChange={(e) => update("address", e.target.value)} />
        </FormField>
      </div>
    </div>
  );
});
