"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { FormField } from "@/components/molecules/FormField";
import { PasswordInput } from "@/components/molecules/PasswordInput";
import { Button } from "@/components/atoms/Button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { changePassword } from "@/services/auth.service";

export function ChangePasswordTab() {
  const router = useRouter();
  const { showToast } = useToast();
  const { token, logout } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    const nextErrors: Record<string, string> = {};
    if (!current) nextErrors.current = "Enter your current password.";
    if (!next || next.length < 6) nextErrors.next = "New password must be at least 6 characters.";
    if (next !== confirm) nextErrors.confirm = "Passwords do not match.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    if (!token) {
      showToast("Your session has expired. Please sign in again.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const { message } = await changePassword({
        token,
        oldPassword: current,
        newPassword: next,
        confirmPassword: confirm,
      });
      showToast(message);
      // The old session token is still technically valid until it expires,
      // so just navigating to /login would get bounced straight back to the
      // dashboard by the route guard — clear it here to force a real re-login.
      logout();
      router.push("/login");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not update password.", "error");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-md rounded-xl border border-border bg-surface-card p-6">
      <h3 className="mb-1 flex items-center gap-2 text-fs-xl font-semibold text-ink">
        <Lock className="size-4 text-primary" />
        Change Password
      </h3>
      <p className="mb-4 text-fs-sm text-muted">Use at least 6 characters. You&apos;ll need to sign in again afterward.</p>

      <div className="flex flex-col gap-4">
        <FormField label="Current Password" htmlFor="pw-current" error={errors.current} required>
          <PasswordInput id="pw-current" value={current} onChange={(e) => setCurrent(e.target.value)} invalid={Boolean(errors.current)} />
        </FormField>
        <FormField label="New Password" htmlFor="pw-new" error={errors.next} required>
          <PasswordInput id="pw-new" value={next} onChange={(e) => setNext(e.target.value)} invalid={Boolean(errors.next)} />
        </FormField>
        <FormField label="Confirm New Password" htmlFor="pw-confirm" error={errors.confirm} required>
          <PasswordInput id="pw-confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} invalid={Boolean(errors.confirm)} />
        </FormField>
        <Button onClick={handleSubmit} className="self-start" isLoading={isSubmitting}>
          Update Password
        </Button>
      </div>
    </div>
  );
}
