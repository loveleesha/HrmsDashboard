import { httpService } from "@/lib/http/http.service";

/**
 * Onboarding Assets — the "HRMS API" collection's file-upload endpoint used
 * by the onboarding wizard (profile picture, Aadhaar/PAN/education
 * certificates, qualification certificates). One call per file; the
 * response's `url` is then embedded in the matching wizard step's payload
 * (step 1 for profilePicture, step 6 for qualificationCertificate, step 8
 * for the identity/education documents) instead of the file itself.
 */
export type OnboardingAssetType =
  | "profilePicture"
  | "aadhaarCard"
  | "panCard"
  | "educationalCertificate"
  | "experienceCertificate"
  | "addressProof"
  | "qualificationCertificate";

export async function uploadOnboardingAsset(file: File, type: OnboardingAssetType): Promise<string> {
  const formData = new FormData();
  formData.append("type", type);
  formData.append("file", file);

  const data = await httpService.post<{ url: string }>("/api/admin/employees/onboard/assets", formData);
  return data.url;
}
