"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/atoms/Spinner";
import { useAuth } from "@/hooks/use-auth";
import { createDraftOnboarding } from "@/services/onboarding.service";

export default function NewOnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const hasCreated = useRef(false);

  useEffect(() => {
    if (hasCreated.current) return;
    hasCreated.current = true;
    const record = createDraftOnboarding(user?.name ?? "HR Team");
    router.replace(`/employees/onboarding/${record.id}`);
  }, [router, user]);

  return (
    <div className="flex items-center justify-center gap-2 py-24 text-muted">
      <Spinner />
      Starting a new onboarding…
    </div>
  );
}
