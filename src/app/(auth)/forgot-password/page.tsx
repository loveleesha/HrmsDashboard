"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { AuthLayout } from "@/components/templates/AuthLayout";
import { FormField } from "@/components/molecules/FormField";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { forgotPassword } from "@/services/auth.service";
import { useToast } from "@/hooks/use-toast";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/schemas/auth.schema";

export default function ForgotPasswordPage() {
  const { showToast } = useToast();
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setFormError(null);
    try {
      const { message } = await forgotPassword(values.email);
      showToast(message);
      setSubmittedEmail(values.email);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not send the reset link.");
    }
  }

  if (submittedEmail) {
    return (
      <AuthLayout
        eyebrow="Account recovery"
        title="Check your email"
        subtitle={`We've sent a password reset link to ${submittedEmail}. Open it to choose a new password.`}
      >
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary">
            <MailCheck className="size-7" />
          </span>
          <Link href="/login" className="text-fs-base text-primary hover:underline">
            ← Back to login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Account recovery"
      title="Forgot your password?"
      subtitle="No worries. Enter your registered email address and we'll send you a link to reset it."
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <FormField label="Email address" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            placeholder="you@hikeassociate.com"
            invalid={Boolean(errors.email)}
            {...register("email")}
          />
        </FormField>

        {formError && <p className="text-fs-base text-danger">{formError}</p>}

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Send Reset Link
        </Button>

        <Link
          href="/login"
          className="text-center text-fs-base text-primary hover:underline"
        >
          ← Back to login
        </Link>
      </form>
    </AuthLayout>
  );
}
