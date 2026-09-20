"use client";

import { Check } from "lucide-react";
import { ONBOARDING_STEP_KEYS, ONBOARDING_STEP_LABELS, type OnboardingStepKey } from "@/types/onboarding";
import { cn } from "@/lib/cn";

export interface OnboardingStepperProps {
  /** Defaults to every onboarding step; the edit screen passes its own subset. */
  steps?: readonly OnboardingStepKey[];
  currentStepIndex: number;
  completedSteps: OnboardingStepKey[];
  invalidSteps?: OnboardingStepKey[];
  onStepSelect: (index: number) => void;
  canNavigateToStep: (index: number) => boolean;
  className?: string;
}

export function OnboardingStepper({
  steps = ONBOARDING_STEP_KEYS,
  currentStepIndex,
  completedSteps,
  invalidSteps = [],
  onStepSelect,
  canNavigateToStep,
  className,
}: OnboardingStepperProps) {
  return (
    <nav aria-label="Onboarding steps" className={cn("flex flex-col gap-1", className)}>
      {steps.map((key, index) => {
        const isCompleted = completedSteps.includes(key);
        const isCurrent = index === currentStepIndex;
        const isInvalid = invalidSteps.includes(key) && !isCurrent;
        const isNavigable = canNavigateToStep(index);

        return (
          <button
            key={key}
            type="button"
            disabled={!isNavigable}
            onClick={() => onStepSelect(index)}
            aria-current={isCurrent ? "step" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-fs-base transition-colors",
              isCurrent
                ? "bg-primary-soft text-primary font-semibold"
                : isNavigable
                  ? "text-ink hover:bg-surface"
                  : "cursor-not-allowed text-muted-light",
            )}
          >
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border text-fs-sm font-semibold",
                isCurrent
                  ? "border-primary bg-primary text-white"
                  : isCompleted
                    ? "border-success bg-success text-white"
                    : isInvalid
                      ? "border-danger text-danger"
                      : "border-border-strong text-muted-light"
              )}
            >
              {isCompleted && !isCurrent ? <Check className="size-3.5" /> : index + 1}
            </span>
            <span className="flex-1 truncate">{ONBOARDING_STEP_LABELS[key]}</span>
          </button>
        );
      })}
    </nav>
  );
}
