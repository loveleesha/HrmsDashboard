"use client";

import { Suspense, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { OnboardingDetail } from "@/components/organisms/onboarding/OnboardingDetail";

export default function OnboardingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  return (
    <div>
      <PageHeader
        title="Employee Onboarding"
        description="Track progress, correct details, or hand off to HR verification."
        actions={
          <Button variant="secondary" size="sm" onClick={() => router.push("/employees/onboarding")}>
            <ArrowLeft className="size-4" />
            Back to List
          </Button>
        }
      />
      <Suspense
        fallback={
          <div className="flex items-center justify-center gap-2 py-24 text-muted">
            <Spinner />
            Loading onboarding record…
          </div>
        }
      >
        <OnboardingDetail id={id} />
      </Suspense>
    </div>
  );
}
