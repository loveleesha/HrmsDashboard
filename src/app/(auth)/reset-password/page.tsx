"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthLayout } from "@/components/templates/AuthLayout";
import { FormField } from "@/components/molecules/FormField";
import { PasswordInput } from "@/components/molecules/PasswordInput";
import { Button } from "@/components/atoms/Button";
import { resetPassword } from "@/services/auth.service";
import { useToast } from "@/hooks/use-toast";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/schemas/auth.schema";

function ResetPasswordForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const resetToken = searchParams.get("token") ?? "";
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordFormValues) {
    setFormError(null);
    if (!email || !resetToken) {
      setFormError("This reset link is invalid or incomplete. Request a new one.");
      return;
    }
    try {
      const { message } = await resetPassword({
        email,
        resetToken,
        newPassword: values.password,
        confirmPassword: values.confirmPassword,
      });
      showToast(message);
      router.push("/login");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not reset your password.");
    }
  }

  return (
    <AuthLayout
      eyebrow="Create new password"
      title="Reset your password"
      subtitle="Choose a strong password that you haven't used before."
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        {!email || !resetToken ? (
          <p className="text-fs-base text-danger">
            This reset link is missing required details. Please request a new one from the forgot
            password page.
          </p>
        ) : null}

        <FormField
          label="New password"
          htmlFor="password"
          error={errors.password?.message}
        >
          <PasswordInput
            id="password"
            placeholder="Enter new password"
            invalid={Boolean(errors.password)}
            {...register("password")}
          />
        </FormField>

        <FormField
          label="Confirm password"
          htmlFor="confirmPassword"
          error={errors.confirmPassword?.message}
        >
          <PasswordInput
            id="confirmPassword"
            placeholder="Confirm new password"
            invalid={Boolean(errors.confirmPassword)}
            {...register("confirmPassword")}
          />
        </FormField>

        <ul className="mb-2 flex flex-col gap-1 text-fs-sm text-muted">
          <li>• Minimum 8 characters</li>
          <li>• Include uppercase and lowercase letters</li>
          <li>• Include at least one number</li>
        </ul>

        {formError && <p className="text-fs-base text-danger">{formError}</p>}

        <Button type="submit" className="w-full" isLoading={isSubmitting} disabled={!email || !resetToken}>
          Update Password
        </Button>
      </form>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
