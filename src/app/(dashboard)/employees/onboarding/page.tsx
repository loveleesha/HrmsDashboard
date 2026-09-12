"use client";

import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Button } from "@/components/atoms/Button";
import { OnboardingList } from "@/components/organisms/onboarding/OnboardingList";
import { useRBAC } from "@/hooks/use-rbac";

export default function EmployeeOnboardingPage() {
  const router = useRouter();
  const { can } = useRBAC();

  return (
    <div>
      <PageHeader
        title="Employee Onboarding"
        description="Bring new hires on board — from basic details through HR verification and activation."
        actions={
          can("employeeOnboarding", "add") ? (
            <Button onClick={() => router.push("/employees/onboarding/new")}>
              <UserPlus className="size-4" />
              Add Employee
            </Button>
          ) : undefined
        }
      />
      <OnboardingList />
    </div>
  );
}
