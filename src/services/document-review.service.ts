import { listEmployeesRemote } from "@/services/employee.service";
import { getEmployeeProfile } from "@/services/profile.service";
import type { Employee } from "@/types/employee";
import type { MyProfile, ProfileDocument } from "@/types/profile";

/**
 * Employees whose onboarding is complete but who still have uploaded
 * documents awaiting HR review. The backend has no "documents pending
 * review" list, and the employee list carries no document info — so this
 * lists completed employees, then reads each one's full profile (Admin >
 * Employees > Get Employee Profile) in small parallel batches and keeps
 * those with a "Pending Review" document. A server-side filter would replace
 * this N+1 read.
 */

export interface PendingReview {
  employee: Employee;
  profile: MyProfile;
  pendingDocuments: ProfileDocument[];
}

const BATCH_SIZE = 8;
const MAX_EMPLOYEES = 100;

export function isPendingReview(status: string | undefined): boolean {
  return Boolean(status) && status!.toLowerCase().includes("pending");
}

export async function listPendingDocumentReviews(): Promise<PendingReview[]> {
  const { employees } = await listEmployeesRemote({ onboardingStatus: "completed", limit: MAX_EMPLOYEES });
  const results: PendingReview[] = [];

  for (let i = 0; i < employees.length; i += BATCH_SIZE) {
    const batch = employees.slice(i, i + BATCH_SIZE);
    const profiles = await Promise.all(
      batch.map((employee) =>
        getEmployeeProfile(employee.id)
          .then((profile) => ({ employee, profile }))
          // One unreadable profile shouldn't blank the whole list.
          .catch(() => null)
      )
    );
    for (const entry of profiles) {
      if (!entry) continue;
      const pendingDocuments = entry.profile.documents.filter((d) => isPendingReview(d.verificationStatus));
      if (pendingDocuments.length > 0) results.push({ ...entry, pendingDocuments });
    }
  }

  return results;
}
