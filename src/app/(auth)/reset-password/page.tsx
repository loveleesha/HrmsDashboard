"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthLayout } from "@/components/templates/AuthLayout";
import { FormField } from "@/components/molecules/FormField";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/schemas/auth.schema";

export default function ResetPasswordPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit() {
    await new Promise((resolve) => setTimeout(resolve, 500));
    router.push("/login");
  }

  return (
    <AuthLayout
      eyebrow="Create new password"
      title="Reset your password"
      subtitle="Choose a strong password that you haven't used before."
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <FormField
          label="New password"
          htmlFor="password"
          error={errors.password?.message}
        >
          <Input
            id="password"
            type="password"
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
          <Input
            id="confirmPassword"
            type="password"
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

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Update Password
        </Button>
      </form>
    </AuthLayout>
  );
}
