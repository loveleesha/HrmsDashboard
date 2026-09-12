/** Imperative handle every onboarding step exposes so the wizard shell can gate "Continue" without lifting each step's field-level state up. */
export interface OnboardingStepHandle {
  /** Runs the step's zod schema against its current local state; returns whether it's safe to advance. */
  validate: () => boolean;
}
