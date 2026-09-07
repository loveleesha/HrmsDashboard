"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthLayout } from "@/components/templates/AuthLayout";
import { FormField } from "@/components/molecules/FormField";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/schemas/auth.schema";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    router.push(`/otp?email=${encodeURIComponent(values.email)}`);
  }

  return (
    <AuthLayout
      eyebrow="Account recovery"
      title="Forgot your password?"
      subtitle="No worries. Enter your registered email address and we'll send you a verification code."
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

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Send Verification Code
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
