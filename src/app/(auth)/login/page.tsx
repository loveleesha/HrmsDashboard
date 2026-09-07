"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { AuthLayout } from "@/components/templates/AuthLayout";
import { FormField } from "@/components/molecules/FormField";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { Checkbox } from "@/components/atoms/Checkbox";
import { Label } from "@/components/atoms/Label";
import { useAuth } from "@/hooks/use-auth";
import { MOCK_USERS } from "@/services/auth.service";
import { ROLE_LABELS } from "@/types/user";
import { loginSchema, type LoginFormValues } from "@/schemas/auth.schema";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    try {
      await login(values.email, values.password);
      router.push("/dashboard");
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to sign in."
      );
    }
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Sign in to your account"
      subtitle="Enter your credentials to securely access your dashboard."
      footer={
        <p className="text-fs-sm text-muted-light">
          Secure access • Your information is protected
        </p>
      }
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

        <FormField
          label="Password"
          htmlFor="password"
          error={errors.password?.message}
        >
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              invalid={Boolean(errors.password)}
              className="pr-10"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-light hover:text-ink"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </FormField>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox id="remember" />
            <Label htmlFor="remember" className="font-normal text-muted">
              Remember me
            </Label>
          </div>
          <Link href="/forgot-password" className="text-fs-base text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        {formError && <p className="text-fs-base text-danger">{formError}</p>}

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Sign In
        </Button>
      </form>

      <div className="mt-6 rounded-lg border border-dashed border-border bg-surface px-4 py-3">
        <p className="mb-2 text-fs-sm font-semibold uppercase tracking-wide text-muted-light">
          Demo accounts (any password, 6+ characters)
        </p>
        <ul className="flex flex-col gap-1 text-fs-sm text-muted">
          {MOCK_USERS.map((user) => (
            <li key={user.id} className="flex justify-between gap-2">
              <span>{user.email}</span>
              <span className="text-muted-light">{ROLE_LABELS[user.role]}</span>
            </li>
          ))}
        </ul>
      </div>
    </AuthLayout>
  );
}
