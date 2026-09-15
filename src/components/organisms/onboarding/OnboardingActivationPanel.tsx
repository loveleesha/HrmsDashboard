"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, PartyPopper, ShieldCheck } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Avatar } from "@/components/atoms/Avatar";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/use-rbac";
import { useRoles } from "@/hooks/use-roles";
import { activateEmployee } from "@/services/onboarding.service";
import { employeeFullName, type OnboardingRecord } from "@/types/onboarding";

export interface OnboardingActivationPanelProps {
  record: OnboardingRecord;
  onRecordChange: (record: OnboardingRecord) => void;
}

export function OnboardingActivationPanel({ record, onRecordChange }: OnboardingActivationPanelProps) {
  const { can } = useRBAC();
  const { getRoleLabel } = useRoles();
  const { showToast } = useToast();
  const router = useRouter();
  const [isActivating, setIsActivating] = useState(false);

  const canActivate = can("employeeOnboarding", "activate");

  async function handleActivate() {
    setIsActivating(true);
    try {
      const updated = await activateEmployee(record.id);
      onRecordChange(updated);
      showToast("Employee activated successfully.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not activate employee.", "error");
    } finally {
      setIsActivating(false);
    }
  }

  if (record.status === "active") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-success/30 bg-success-bg px-6 py-10 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-success text-white">
          <PartyPopper className="size-7" />
        </span>
        <div>
          <h2 className="text-fs-4xl font-semibold text-ink">Employee Onboarding Completed</h2>
          <p className="mt-1 text-fs-base text-muted">
            {employeeFullName(record.basicInfo)} is now active and can sign in with their email and password.
          </p>
        </div>

        <div className="grid w-full max-w-md grid-cols-2 gap-4 rounded-xl border border-border bg-surface-card p-5 text-left">
          <div>
            <p className="text-fs-sm text-muted-light">Employee ID</p>
            <p className="text-fs-xl font-semibold text-ink">{record.employeeId}</p>
          </div>
          <div>
            <p className="text-fs-sm text-muted-light">Status</p>
            <p className="text-fs-xl font-semibold text-success">Active</p>
          </div>
          <div>
            <p className="text-fs-sm text-muted-light">Email</p>
            <p className="text-fs-base text-ink">{record.basicInfo.email}</p>
          </div>
          <div>
            <p className="text-fs-sm text-muted-light">Role</p>
            <p className="text-fs-base text-ink">{getRoleLabel(record.roleAccess.role)}</p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => router.push(`/employees/onboarding/${record.id}`)}>View Employee Profile</Button>
          <Button variant="secondary" onClick={() => router.push("/employees/onboarding")}>
            Back to Employee List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface-card px-6 py-10 text-center">
      <Avatar name={employeeFullName(record.basicInfo) || "New Hire"} imageUrl={record.basicInfo.profilePictureUrl} size="lg" />
      <div>
        <h2 className="text-fs-3xl font-semibold text-ink">Ready for Activation</h2>
        <p className="mt-1 max-w-md text-fs-base text-muted">
          All required documents for {employeeFullName(record.basicInfo)} have been verified. Activate the
          account to generate the Employee ID and enable login.
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-success-bg px-3 py-1.5 text-fs-sm text-success">
        <ShieldCheck className="size-4" />
        All required documents verified
      </div>

      {canActivate ? (
        <Button size="lg" onClick={handleActivate} isLoading={isActivating}>
          <CheckCircle2 className="size-4" />
          Activate Employee
        </Button>
      ) : (
        <p className="text-fs-sm text-muted-light">Your role does not have permission to activate employees.</p>
      )}
    </div>
  );
}
