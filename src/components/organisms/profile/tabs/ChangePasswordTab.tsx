"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { FormField } from "@/components/molecules/FormField";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { useToast } from "@/hooks/use-toast";

export function ChangePasswordTab() {
  const { showToast } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit() {
    const nextErrors: Record<string, string> = {};
    if (!current) nextErrors.current = "Enter your current password.";
    if (!next || next.length < 6) nextErrors.next = "New password must be at least 6 characters.";
    if (next !== confirm) nextErrors.confirm = "Passwords do not match.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setCurrent("");
    setNext("");
    setConfirm("");
    setErrors({});
    showToast("Password updated successfully.");
  }

  return (
    <div className="max-w-md rounded-xl border border-border bg-surface-card p-6">
      <h3 className="mb-1 flex items-center gap-2 text-fs-xl font-semibold text-ink">
        <Lock className="size-4 text-primary" />
        Change Password
      </h3>
      <p className="mb-4 text-fs-sm text-muted">Use at least 6 characters. You&apos;ll stay signed in on this device.</p>

      <div className="flex flex-col gap-4">
        <FormField label="Current Password" htmlFor="pw-current" error={errors.current} required>
          <Input id="pw-current" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} invalid={Boolean(errors.current)} />
        </FormField>
        <FormField label="New Password" htmlFor="pw-new" error={errors.next} required>
          <Input id="pw-new" type="password" value={next} onChange={(e) => setNext(e.target.value)} invalid={Boolean(errors.next)} />
        </FormField>
        <FormField label="Confirm New Password" htmlFor="pw-confirm" error={errors.confirm} required>
          <Input id="pw-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} invalid={Boolean(errors.confirm)} />
        </FormField>
        <Button onClick={handleSubmit} className="self-start">
          Update Password
        </Button>
      </div>
    </div>
  );
}
