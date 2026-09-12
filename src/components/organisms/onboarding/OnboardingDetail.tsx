"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UserX } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { OnboardingWizard } from "@/components/organisms/onboarding/OnboardingWizard";
import { OnboardingOverview } from "@/components/organisms/onboarding/OnboardingOverview";
import { getOnboardingById } from "@/services/onboarding.service";
import { ONBOARDING_STEP_KEYS, type OnboardingRecord, type OnboardingStepKey } from "@/types/onboarding";

export interface OnboardingDetailProps {
  id: string;
}

export function OnboardingDetail({ id }: OnboardingDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [record, setRecord] = useState<OnboardingRecord | null | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;
    getOnboardingById(id).then((result) => {
      if (isMounted) setRecord(result ?? null);
    });
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (record === undefined) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted">
        <Spinner />
        Loading onboarding record…
      </div>
    );
  }

  if (record === null) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface-card px-6 py-20 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-danger-bg text-danger">
          <UserX className="size-7" />
        </span>
        <h2 className="text-fs-4xl font-semibold text-ink">Onboarding record not found</h2>
        <p className="max-w-md text-fs-lg text-muted">
          It may have been removed, or the link is incorrect.
        </p>
        <Button variant="secondary" onClick={() => router.push("/employees/onboarding")}>
          Back to Onboarding List
        </Button>
      </div>
    );
  }

  const requestedStep = searchParams.get("step") as OnboardingStepKey | null;
  const isEditMode = searchParams.get("mode") === "edit";
  const initialStepKey = requestedStep && ONBOARDING_STEP_KEYS.includes(requestedStep) ? requestedStep : "review";

  if (record.status === "draft" || isEditMode) {
    return (
      <OnboardingWizard
        initialRecord={record}
        initialStepKey={record.status === "draft" ? undefined : initialStepKey}
        onRecordChange={setRecord}
      />
    );
  }

  return <OnboardingOverview initialRecord={record} />;
}
