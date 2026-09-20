"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, ChevronDown } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/molecules/Modal";
import { useToast } from "@/hooks/use-toast";
import { saveOnboardingRecord, submitOnboarding } from "@/services/onboarding.service";
import { OnboardingStepper } from "@/components/organisms/onboarding/OnboardingStepper";
import { BasicInfoStep } from "@/components/organisms/onboarding/steps/BasicInfoStep";
import { ContactInfoStep } from "@/components/organisms/onboarding/steps/ContactInfoStep";
import { ProfessionalInfoStep } from "@/components/organisms/onboarding/steps/ProfessionalInfoStep";
import { RoleAccessStep } from "@/components/organisms/onboarding/steps/RoleAccessStep";
import { TechnologyStep } from "@/components/organisms/onboarding/steps/TechnologyStep";
import { QualificationStep } from "@/components/organisms/onboarding/steps/QualificationStep";
import { EmergencyContactsStep } from "@/components/organisms/onboarding/steps/EmergencyContactsStep";
import { DocumentsStep } from "@/components/organisms/onboarding/steps/DocumentsStep";
import { ReviewStep } from "@/components/organisms/onboarding/steps/ReviewStep";
import { ONBOARDING_STEP_KEYS, ONBOARDING_STEP_LABELS, type OnboardingRecord, type OnboardingStepKey } from "@/types/onboarding";
import type { OnboardingStepHandle } from "@/components/organisms/onboarding/step-types";

export interface OnboardingWizardProps {
  initialRecord: OnboardingRecord;
  /** Step to open on, by key — lets an Edit action on the review/overview screen jump straight to the relevant step. Defaults to the record's saved progress. */
  initialStepKey?: OnboardingStepKey;
  /**
   * Called whenever the record is persisted. The wizard and its parent both
   * render off this same record id/URL, so once status moves past "draft"
   * a `router.push` to that unchanged URL won't remount anything — the
   * parent needs this callback to know to swap the wizard out for the
   * overview screen itself.
   */
  onRecordChange?: (record: OnboardingRecord) => void;
  /**
   * "edit" reuses the same per-step forms and save endpoints to update an
   * already-onboarded employee: every step is unlocked, each step saves on its
   * own, and it never runs the final submit (step 9 resets the employee's
   * password and re-emails them). Defaults to "create".
   */
  mode?: "create" | "edit";
  /** Steps to show, in order. Defaults to all of them. */
  steps?: readonly OnboardingStepKey[];
  /** Where Cancel / Save & Finish lead. */
  exitHref?: string;
}

export function OnboardingWizard({
  initialRecord,
  initialStepKey,
  onRecordChange,
  mode = "create",
  steps,
  exitHref = "/employees/onboarding",
}: OnboardingWizardProps) {
  const stepKeys = steps ?? ONBOARDING_STEP_KEYS;
  const isEdit = mode === "edit";
  const router = useRouter();
  const { showToast } = useToast();
  const [record, setRecord] = useState<OnboardingRecord>(initialRecord);
  const [stepIndex, setStepIndex] = useState(() => {
    if (initialStepKey && stepKeys.includes(initialStepKey)) return stepKeys.indexOf(initialStepKey);
    return Math.min(initialRecord.currentStepIndex, stepKeys.length - 1);
  });
  const [isSaving, setIsSaving] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [stepsOpen, setStepsOpen] = useState(false);
  const stepRef = useRef<OnboardingStepHandle>(null);

  const currentStepKey: OnboardingStepKey = stepKeys[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === stepKeys.length - 1;
  const maxUnlockedIndex =
    record.status === "draft" && !isEdit ? record.completedSteps.length : stepKeys.length - 1;

  function updateField<K extends keyof OnboardingRecord>(key: K, value: OnboardingRecord[K]) {
    setRecord((prev) => ({ ...prev, [key]: value }));
  }

  function markStepCompleted(key: OnboardingStepKey) {
    setRecord((prev) =>
      prev.completedSteps.includes(key) ? prev : { ...prev, completedSteps: [...prev.completedSteps, key] }
    );
  }

  async function persist(next: OnboardingRecord, stepKey: OnboardingStepKey) {
    setIsSaving(true);
    try {
      const saved = await saveOnboardingRecord(next, stepKey);
      setRecord(saved);
      onRecordChange?.(saved);
      return saved;
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not save this step. Please try again.", "error");
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveDraft() {
    const next = { ...record, currentStepIndex: stepIndex };
    const saved = await persist(next, currentStepKey);
    if (!saved) return;
    showToast("Saved as draft.");
    router.push("/employees/onboarding");
  }

  async function handleBack() {
    if (isFirstStep) return;
    setStepIndex((prev) => prev - 1);
  }

  async function handleContinue() {
    const isValid = stepRef.current?.validate() ?? true;
    if (!isValid) return;

    markStepCompleted(currentStepKey);

    if (isLastStep) {
      const next = { ...record, currentStepIndex: stepIndex, completedSteps: Array.from(new Set([...record.completedSteps, currentStepKey])) };
      const saved = await persist(next, currentStepKey);
      if (!saved) return;

      if (saved.status !== "draft") {
        // Editing an already-submitted record: save the corrections without re-running submission side effects.
        showToast("Changes saved.");
        router.push(`/employees/onboarding/${saved.id}`);
        return;
      }

      setIsSaving(true);
      try {
        await submitOnboarding(saved);
        showToast("Onboarding submitted.");
        router.push("/employees/onboarding");
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Could not submit onboarding. Please try again.", "error");
      } finally {
        setIsSaving(false);
      }
      return;
    }

    const nextIndex = stepIndex + 1;
    const next = {
      ...record,
      currentStepIndex: nextIndex,
      completedSteps: Array.from(new Set([...record.completedSteps, currentStepKey])),
    };
    const saved = await persist(next, currentStepKey);
    if (!saved) return;
    setStepIndex(nextIndex);
  }

  async function handleEditSave(after: "stay" | "next" | "finish") {
    const isValid = stepRef.current?.validate() ?? true;
    if (!isValid) return;
    const saved = await persist(record, currentStepKey);
    if (!saved) return;
    showToast(`${ONBOARDING_STEP_LABELS[currentStepKey]} updated.`);
    if (after === "next") setStepIndex((prev) => prev + 1);
    if (after === "finish") router.push(exitHref);
  }

  function handleStepSelect(index: number) {
    if (index > maxUnlockedIndex) return;
    setStepIndex(index);
    setStepsOpen(false);
  }

  function handleCancelConfirm() {
    setCancelOpen(false);
    router.push(exitHref);
  }

  function renderStep() {
    switch (currentStepKey) {
      case "basicInfo":
        return (
          <BasicInfoStep
            ref={stepRef}
            value={record.basicInfo}
            onChange={(value) => updateField("basicInfo", value)}
            recordId={record.id}
          />
        );
      case "contactInfo":
        return (
          <ContactInfoStep ref={stepRef} value={record.contactInfo} onChange={(value) => updateField("contactInfo", value)} />
        );
      case "professionalInfo":
        return (
          <ProfessionalInfoStep
            ref={stepRef}
            value={record.professionalInfo}
            onChange={(value) => updateField("professionalInfo", value)}
          />
        );
      case "roleAccess":
        return (
          <RoleAccessStep ref={stepRef} value={record.roleAccess} onChange={(value) => updateField("roleAccess", value)} />
        );
      case "technology":
        return (
          <TechnologyStep ref={stepRef} value={record.technology} onChange={(value) => updateField("technology", value)} />
        );
      case "qualification":
        return (
          <QualificationStep
            ref={stepRef}
            value={record.qualifications}
            onChange={(value) => updateField("qualifications", value)}
          />
        );
      case "emergencyContacts":
        return (
          <EmergencyContactsStep
            ref={stepRef}
            value={record.emergencyContacts}
            onChange={(value) => updateField("emergencyContacts", value)}
          />
        );
      case "documents":
        return (
          <DocumentsStep ref={stepRef} value={record.documents} onChange={(value) => updateField("documents", value)} />
        );
      case "review":
        return (
          <ReviewStep
            ref={stepRef}
            record={record}
            onEditStep={setStepIndex}
            onConfirmChange={(confirmed) => updateField("confirmedAccurate", confirmed)}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="flex flex-col gap-6 xl:flex-row">
      <aside className="shrink-0 rounded-xl border border-border bg-surface-card p-3 xl:w-72">
        {/* Below xl (the app sidebar already takes 256px): one compact "Step X of N" header that expands into the full list, so the form isn't pushed a screen down. */}
        <div className="xl:hidden">
          <button
            type="button"
            onClick={() => setStepsOpen((open) => !open)}
            aria-expanded={stepsOpen}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <span className="min-w-0">
              <span className="block text-fs-sm text-muted">
                Step {stepIndex + 1} of {stepKeys.length}
              </span>
              <span className="block truncate text-fs-lg font-semibold text-ink">{ONBOARDING_STEP_LABELS[currentStepKey]}</span>
            </span>
            <ChevronDown className={`size-5 shrink-0 text-muted-light transition-transform ${stepsOpen ? "rotate-180" : ""}`} />
          </button>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface" aria-hidden="true">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((stepIndex + 1) / stepKeys.length) * 100}%` }} />
          </div>
          {stepsOpen && (
            <div className="mt-3 border-t border-border pt-3">
              <OnboardingStepper
                steps={stepKeys}
                currentStepIndex={stepIndex}
                completedSteps={record.completedSteps}
                onStepSelect={handleStepSelect}
                canNavigateToStep={(index) => index <= maxUnlockedIndex}
              />
            </div>
          )}
        </div>
        <div className="hidden xl:block">
          <OnboardingStepper
            steps={stepKeys}
            currentStepIndex={stepIndex}
            completedSteps={record.completedSteps}
            onStepSelect={handleStepSelect}
            canNavigateToStep={(index) => index <= maxUnlockedIndex}
          />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="rounded-xl border border-border bg-surface-card p-5 sm:p-6">{renderStep()}</div>

        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-surface-card p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
            <Button variant="secondary" onClick={handleBack} disabled={isFirstStep || isSaving}>
              Back
            </Button>
            <Button variant="ghost" onClick={() => setCancelOpen(true)} disabled={isSaving}>
              <Ban className="size-4" />
              Cancel
            </Button>
          </div>
          {isEdit ? (
            <div className="grid grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
              <Button variant="secondary" onClick={() => handleEditSave("stay")} isLoading={isSaving}>
                Save
              </Button>
              <Button onClick={() => handleEditSave(isLastStep ? "finish" : "next")} isLoading={isSaving}>
                {isLastStep ? "Save & Finish" : "Save & Continue"}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
              <Button variant="secondary" onClick={handleSaveDraft} isLoading={isSaving}>
                Save as Draft
              </Button>
              <Button onClick={handleContinue} isLoading={isSaving}>
                {isLastStep ? "Submit Onboarding" : "Continue"}
              </Button>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title={isEdit ? "Leave without saving?" : "Discard changes?"}
        description={
          isEdit
            ? "Steps you've already saved keep their changes."
            : "You'll be taken back to the onboarding list. Anything saved as a draft stays put."
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCancelOpen(false)}>
              Keep Editing
            </Button>
            <Button variant="danger" onClick={handleCancelConfirm}>
              Discard & Exit
            </Button>
          </div>
        }
      >
        <p className="text-fs-base text-muted">Unsaved changes on this step will be lost.</p>
      </Modal>
    </div>
  );
}
