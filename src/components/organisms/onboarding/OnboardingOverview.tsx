"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PowerOff, ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/molecules/Modal";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/use-rbac";
import { deactivateEmployee } from "@/services/onboarding.service";
import { OnboardingStatusTimeline } from "@/components/organisms/onboarding/OnboardingStatusTimeline";
import { OnboardingActivationPanel } from "@/components/organisms/onboarding/OnboardingActivationPanel";
import { ReviewStep } from "@/components/organisms/onboarding/steps/ReviewStep";
import { employeeFullName, ONBOARDING_STATUS_LABELS, ONBOARDING_STEP_KEYS, type OnboardingRecord } from "@/types/onboarding";

export interface OnboardingOverviewProps {
  initialRecord: OnboardingRecord;
}

export function OnboardingOverview({ initialRecord }: OnboardingOverviewProps) {
  const router = useRouter();
  const { can } = useRBAC();
  const { showToast } = useToast();
  const [record, setRecord] = useState(initialRecord);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  function goToEditStep(index: number) {
    const stepKey = ONBOARDING_STEP_KEYS[index];
    router.push(`/employees/onboarding/${record.id}?mode=edit&step=${stepKey}`);
  }

  async function handleDeactivate() {
    setIsDeactivating(true);
    try {
      const updated = await deactivateEmployee(record.id);
      setRecord(updated);
      showToast("Employee deactivated.");
    } catch {
      showToast("Could not deactivate employee.", "error");
    } finally {
      setIsDeactivating(false);
      setDeactivateOpen(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="shrink-0 rounded-xl border border-border bg-surface-card p-5 lg:w-72">
        <p className="mb-4 text-fs-lg font-semibold text-ink">Onboarding Progress</p>
        <OnboardingStatusTimeline record={record} />
      </aside>

      <div className="min-w-0 flex-1 space-y-6">
        <div className="rounded-xl border border-border bg-surface-card p-5">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar name={employeeFullName(record.basicInfo) || "New Hire"} imageUrl={record.basicInfo.profilePictureUrl} size="lg" />
            <div className="flex-1">
              <p className="text-fs-2xl font-semibold text-ink">{employeeFullName(record.basicInfo) || "Unnamed Candidate"}</p>
              <p className="text-fs-base text-muted">
                {record.professionalInfo.designation || "Designation not set"} · {record.professionalInfo.department || "—"}
              </p>
              {record.employeeId && <p className="mt-1 text-fs-base font-semibold text-primary">{record.employeeId}</p>}
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge tone={record.status === "active" ? "success" : record.status === "inactive" ? "neutral" : "warning"}>
                {ONBOARDING_STATUS_LABELS[record.status]}
              </Badge>
              {record.status === "pending_verification" && can("employeeOnboarding", "verifyDocuments") && (
                <Button size="sm" onClick={() => router.push(`/employees/onboarding/${record.id}/verify`)}>
                  <ShieldCheck className="size-3.5" />
                  Verify Documents
                </Button>
              )}
              {record.status === "active" && can("employeeOnboarding", "activate") && (
                <Button size="sm" variant="danger" onClick={() => setDeactivateOpen(true)}>
                  <PowerOff className="size-3.5" />
                  Deactivate
                </Button>
              )}
            </div>
          </div>
        </div>

        {record.status === "pending_verification" && (
          <div className="rounded-xl border border-dashed border-border bg-surface-card p-5 text-center">
            <p className="text-fs-lg font-medium text-ink">Awaiting HR Verification</p>
            <p className="mt-1 text-fs-base text-muted">
              Documents have been submitted and are pending manual review by HR.
            </p>
          </div>
        )}

        {(record.status === "verified" || record.status === "active") && (
          <OnboardingActivationPanel record={record} onRecordChange={setRecord} />
        )}

        <ReviewStep
          record={record}
          onEditStep={goToEditStep}
          onConfirmChange={() => undefined}
          hideConfirmation
        />
      </div>

      <Modal
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        title="Deactivate employee?"
        description="They will immediately lose access to sign in."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeactivateOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeactivate} isLoading={isDeactivating}>
              Deactivate
            </Button>
          </div>
        }
      >
        <p className="text-fs-base text-muted">
          {employeeFullName(record.basicInfo)} ({record.employeeId}) will be marked inactive.
        </p>
      </Modal>
    </div>
  );
}
