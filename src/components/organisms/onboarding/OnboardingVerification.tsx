"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserX } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { DocumentVerificationPanel } from "@/components/organisms/onboarding/DocumentVerificationPanel";
import { getOnboardingById } from "@/services/onboarding.service";
import type { OnboardingRecord } from "@/types/onboarding";

export function OnboardingVerification({ id }: { id: string }) {
  const router = useRouter();
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
        <Button variant="secondary" onClick={() => router.push("/employees/onboarding")}>
          Back to Onboarding List
        </Button>
      </div>
    );
  }

  return <DocumentVerificationPanel record={record} onRecordChange={setRecord} />;
}
