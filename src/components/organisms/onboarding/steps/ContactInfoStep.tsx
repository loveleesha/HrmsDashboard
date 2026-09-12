"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { FormField } from "@/components/molecules/FormField";
import { Input } from "@/components/atoms/Input";
import { contactInfoSchema } from "@/schemas/onboarding.schema";
import { checkEmailExists } from "@/services/onboarding.service";
import type { ContactInfo } from "@/types/onboarding";
import type { OnboardingStepHandle } from "@/components/organisms/onboarding/step-types";

export interface ContactInfoStepProps {
  value: ContactInfo;
  onChange: (value: ContactInfo) => void;
  recordId: string;
}

export const ContactInfoStep = forwardRef<OnboardingStepHandle, ContactInfoStepProps>(function ContactInfoStep(
  { value, onChange, recordId },
  ref
) {
  const [errors, setErrors] = useState<Partial<Record<keyof ContactInfo, string>>>({});
  const [emailCheck, setEmailCheck] = useState<"idle" | "checking" | "available" | "conflict">("idle");

  useImperativeHandle(ref, () => ({
    validate: () => {
      const result = contactInfoSchema.safeParse(value);
      const nextErrors: Partial<Record<keyof ContactInfo, string>> = {};
      if (!result.success) {
        for (const issue of result.error.issues) {
          const field = issue.path[0] as keyof ContactInfo;
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

  function update<K extends keyof ContactInfo>(key: K, next: ContactInfo[K]) {
    onChange({ ...value, [key]: next });
  }

  async function handleEmailBlur() {
    const parsed = contactInfoSchema.shape.email.safeParse(value.email);
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
        <h2 className="text-fs-3xl font-semibold text-ink">Contact Information</h2>
        <p className="mt-1 text-fs-base text-muted">
          Authentication uses email and password only — mobile number is profile information and is
          never used to sign in.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
