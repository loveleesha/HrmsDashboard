import { Check } from "lucide-react";
import { allRequiredDocumentsVerified, ONBOARDING_STEP_KEYS, type OnboardingRecord } from "@/types/onboarding";
import { cn } from "@/lib/cn";

export interface OnboardingStatusTimelineProps {
  record: OnboardingRecord;
  className?: string;
}

export function OnboardingStatusTimeline({ record, className }: OnboardingStatusTimelineProps) {
  const profileCompleted = record.completedSteps.length >= ONBOARDING_STEP_KEYS.length - 1 || record.status !== "draft";
  const documentsUploaded = record.documents.filter((doc) => doc.required).every((doc) => Boolean(doc.fileName));
  const hrVerificationReached = record.status === "pending_verification" || record.status === "verified" || record.status === "active" || record.status === "inactive";
  const documentsVerified = allRequiredDocumentsVerified(record);
  const employeeIdGenerated = Boolean(record.employeeId);
  const accountActivated = record.status === "active" || record.status === "inactive";

  const stages = [
    { label: "Employee Created", done: true },
    { label: "Profile Completed", done: profileCompleted },
    { label: "Documents Uploaded", done: documentsUploaded },
    { label: "HR Verification Pending", done: hrVerificationReached },
    { label: "Documents Verified", done: documentsVerified },
    { label: "Employee ID Generated", done: employeeIdGenerated },
    { label: "Account Activated", done: accountActivated },
  ];

  const currentIndex = stages.findLastIndex((stage) => stage.done);

  return (
    <ol className={cn("flex flex-col gap-0", className)}>
      {stages.map((stage, index) => {
        const isCurrent = index === currentIndex && !accountActivated;
        return (
          <li key={stage.label} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-fs-sm font-semibold",
                  stage.done
                    ? "border-success bg-success text-white"
                    : isCurrent
                      ? "border-primary text-primary"
                      : "border-border-strong text-muted-light"
                )}
              >
                {stage.done ? <Check className="size-3.5" /> : index + 1}
              </span>
              {index < stages.length - 1 && (
                <span className={cn("w-px flex-1 min-h-6", stage.done ? "bg-success" : "bg-border")} />
              )}
            </div>
            <div className="pb-6">
              <p className={cn("text-fs-base font-medium", stage.done ? "text-ink" : isCurrent ? "text-primary" : "text-muted-light")}>
                {stage.label}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
