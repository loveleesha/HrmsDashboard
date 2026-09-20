"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Tabs } from "@/components/molecules/Tabs";
import { Button } from "@/components/atoms/Button";
import { OnboardingList } from "@/components/organisms/onboarding/OnboardingList";
import { PendingReviewList } from "@/components/organisms/onboarding/PendingReviewList";
import { useRBAC } from "@/hooks/use-rbac";

export default function EmployeeOnboardingPage() {
  const router = useRouter();
  const { can } = useRBAC();
  const canReview = can("employeeOnboarding", "verifyDocuments");
  const [requestedTab, setTab] = useState("progress");
  const tab = requestedTab === "review" && !canReview ? "progress" : requestedTab;

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
      {canReview && (
        <div className="mb-4">
          <Tabs
            options={[
              { label: "In Progress", value: "progress" },
              { label: "Pending Review", value: "review" },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>
      )}
      {tab === "review" ? <PendingReviewList /> : <OnboardingList />}
    </div>
  );
}
