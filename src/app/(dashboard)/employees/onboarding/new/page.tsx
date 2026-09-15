"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Button } from "@/components/atoms/Button";
import { useAuth } from "@/hooks/use-auth";
import { OnboardingWizard } from "@/components/organisms/onboarding/OnboardingWizard";
import { createDraftOnboarding } from "@/services/onboarding.service";
import type { OnboardingRecord } from "@/types/onboarding";

export default function NewOnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  // No backend record exists until Basic Information (step 1) is saved —
  // this page stays put for that first step, then hands off to the record's
  // real URL once saveOnboardingRecord returns a real userId.
  const initialRecord = useMemo(() => createDraftOnboarding(user?.name ?? "HR Team"), [user]);

  function handleRecordChange(record: OnboardingRecord) {
    if (record.id) {
      router.replace(`/employees/onboarding/${record.id}`);
    }
  }

  return (
    <div>
      <PageHeader
        title="Add Employee"
        description="Bring a new hire on board — from basic details through documents."
        actions={
          <Button variant="secondary" size="sm" onClick={() => router.push("/employees/onboarding")}>
            <ArrowLeft className="size-4" />
            Back to List
          </Button>
        }
      />
      <OnboardingWizard initialRecord={initialRecord} onRecordChange={handleRecordChange} />
    </div>
  );
}
