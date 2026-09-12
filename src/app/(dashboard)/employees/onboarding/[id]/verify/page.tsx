"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Button } from "@/components/atoms/Button";
import { OnboardingVerification } from "@/components/organisms/onboarding/OnboardingVerification";

export default function OnboardingVerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  return (
    <div>
      <PageHeader
        title="Document Verification"
        description="Manually review each uploaded document before the employee can be activated."
        actions={
          <Button variant="secondary" size="sm" onClick={() => router.push(`/employees/onboarding/${id}`)}>
            <ArrowLeft className="size-4" />
            Back to Onboarding
          </Button>
        }
      />
      <OnboardingVerification id={id} />
    </div>
  );
}
