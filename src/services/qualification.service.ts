/**
 * There's no endpoint to add a qualification outside the onboarding wizard
 * (see profile.service.ts) — QualificationTab's "Add New Qualification" form
 * only appends this id-tagged entry to local state, unpersisted.
 */
export function newQualificationId(): string {
  return `QUAL-${Math.floor(10 + Math.random() * 89)}`;
}
