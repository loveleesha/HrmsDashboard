"use client";

import { Suspense, use, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ShieldOff } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { OnboardingWizard } from "@/components/organisms/onboarding/OnboardingWizard";
import { useRBAC } from "@/hooks/use-rbac";
import { getEmployeeProfile } from "@/services/profile.service";
import { mapProfileToOnboardingRecord } from "@/services/onboarding.service";
import { ONBOARDING_STEP_KEYS, type OnboardingStepKey } from "@/types/onboarding";
import type { MyProfile } from "@/types/profile";

function EditEmployee({ id }: { id: string }) {
  const router = useRouter();
  const { can } = useRBAC();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const canEdit = can("employees", "edit");

  useEffect(() => {
    if (!canEdit) return;
    let isMounted = true;
    getEmployeeProfile(id)
      .then((data) => {
        if (isMounted) setProfile(data);
      })
      .catch((err) => {
        if (isMounted) setLoadError(err instanceof Error ? err.message : "Could not load this employee.");
      });
    return () => {
      isMounted = false;
    };
  }, [id, canEdit]);

  // "review" is the onboarding-only confirm-and-submit step (it triggers the
  // welcome email + password reset), and changing a role needs roleAccess.edit.
  const canChangeRole = can("roleAccess", "edit");
  const steps = useMemo(
    () => ONBOARDING_STEP_KEYS.filter((key) => key !== "review" && (key !== "roleAccess" || canChangeRole)),
    [canChangeRole]
  );
  const record = useMemo(() => (profile ? mapProfileToOnboardingRecord(profile) : null), [profile]);
  const requestedStep = searchParams.get("step") as OnboardingStepKey | null;

  if (!canEdit) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface-card px-6 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-warning-bg text-warning">
          <ShieldOff className="size-7" />
        </span>
        <h2 className="text-fs-2xl font-semibold text-ink">You can&apos;t edit employees</h2>
        <p className="max-w-md text-fs-base text-muted">Ask an admin to grant your role the Employees → Edit permission.</p>
        <Button variant="secondary" onClick={() => router.push("/employees")}>
          Back to Directory
        </Button>
      </div>
    );
  }

  if (loadError) {
    return <p className="rounded-xl border border-dashed border-border bg-surface-card px-6 py-16 text-center text-fs-base text-danger">{loadError}</p>;
  }

  if (!record) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted">
        <Spinner />
        Loading employee…
      </div>
    );
  }

  return (
    <OnboardingWizard
      mode="edit"
      initialRecord={record}
      initialStepKey={requestedStep ?? undefined}
      steps={steps}
      exitHref="/employees"
    />
  );
}

export default function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  return (
    <div>
      <PageHeader
        title="Edit Employee"
        description="Update any detail or document. Each step saves on its own."
        actions={
          <Button variant="secondary" size="sm" onClick={() => router.push("/employees")}>
            <ArrowLeft className="size-4" />
            Back to Directory
          </Button>
        }
      />
      <Suspense
        fallback={
          <div className="flex items-center justify-center gap-2 py-24 text-muted">
            <Spinner />
            Loading…
          </div>
        }
      >
        <EditEmployee id={id} />
      </Suspense>
    </div>
  );
}
