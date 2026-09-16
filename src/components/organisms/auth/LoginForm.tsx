"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck, User as UserIcon } from "lucide-react";
import { AuthLayout } from "@/components/templates/AuthLayout";
import { FormField } from "@/components/molecules/FormField";
import { Input } from "@/components/atoms/Input";
import { PasswordInput } from "@/components/molecules/PasswordInput";
import { Button } from "@/components/atoms/Button";
import { Checkbox } from "@/components/atoms/Checkbox";
import { Label } from "@/components/atoms/Label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { loginSchema, type LoginFormValues } from "@/schemas/auth.schema";
import type { AuthAudience } from "@/services/auth.service";
import { cn } from "@/lib/cn";

const AUDIENCE_COPY: Record<AuthAudience, { eyebrow: string; title: string; subtitle: string; route: string }> = {
  user: {
    eyebrow: "Welcome back",
    title: "Sign in to your account",
    subtitle: "Enter your credentials to securely access your dashboard.",
    route: "/login",
  },
  admin: {
    eyebrow: "Admin access",
    title: "Sign in to the admin",
    subtitle: "Manage employees, roles, and organization-wide settings.",
    route: "/admin/login",
  },
};

const AUDIENCE_OPTIONS: { value: AuthAudience; label: string; icon: typeof UserIcon }[] = [
  { value: "user", label: "Login as User", icon: UserIcon },
  { value: "admin", label: "Login as Admin", icon: ShieldCheck },
];

export interface LoginFormProps {
  audience: AuthAudience;
}

export function LoginForm({ audience }: LoginFormProps) {
  const router = useRouter();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const copy = AUDIENCE_COPY[audience];

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
      const { message } = await login(values.email, values.password, audience);
      showToast(message);
      router.push("/dashboard");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to sign in.");
    }
  }

  return (
    <AuthLayout
      eyebrow={copy.eyebrow}
      title={copy.title}
      subtitle={copy.subtitle}
      footer={
        <p className="text-fs-sm text-muted-light">
          Secure access • Your information is protected
        </p>
      }
    >
      <div role="tablist" aria-label="Sign in as" className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-surface p-1">
        {AUDIENCE_OPTIONS.map((option) => {
          const isActive = option.value === audience;
          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                if (!isActive) router.push(AUDIENCE_COPY[option.value].route);
              }}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-fs-base font-medium transition-colors",
                isActive ? "bg-surface-card text-ink shadow-sm" : "text-muted hover:text-ink"
              )}
            >
              <option.icon className="size-4" />
              {option.label}
            </button>
          );
        })}
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <FormField label="Email address" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            placeholder={audience === "admin" ? "admin@hikeassociate.com" : "you@hikeassociate.com"}
            invalid={Boolean(errors.email)}
            {...register("email")}
          />
        </FormField>

        <FormField label="Password" htmlFor="password" error={errors.password?.message}>
          <PasswordInput
            id="password"
            placeholder="Enter your password"
            invalid={Boolean(errors.password)}
            {...register("password")}
          />
        </FormField>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox id="remember" />
            <Label htmlFor="remember" className="font-normal text-muted">
              Remember me
            </Label>
          </div>
          {audience === "user" && (
            <Link href="/forgot-password" className="text-fs-base text-primary hover:underline">
              Forgot password?
            </Link>
          )}
        </div>

        {formError && <p className="text-fs-base text-danger">{formError}</p>}

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          {audience === "admin" ? "Sign In as Admin" : "Sign In"}
        </Button>
      </form>
    </AuthLayout>
  );
}
