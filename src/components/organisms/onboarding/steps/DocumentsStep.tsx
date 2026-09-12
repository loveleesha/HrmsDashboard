"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { FileText } from "lucide-react";
import { FileUploadField } from "@/components/molecules/FileUploadField";
import { Badge } from "@/components/atoms/Badge";
import type { OnboardingDocument } from "@/types/onboarding";
import type { OnboardingStepHandle } from "@/components/organisms/onboarding/step-types";

export interface DocumentsStepProps {
  value: OnboardingDocument[];
  onChange: (value: OnboardingDocument[]) => void;
}

const STATUS_TONE = { PENDING: "warning", VERIFIED: "success", REJECTED: "danger" } as const;

export const DocumentsStep = forwardRef<OnboardingStepHandle, DocumentsStepProps>(function DocumentsStep(
  { value, onChange },
  ref
) {
  const [error, setError] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    validate: () => {
      const missingRequired = value.filter((doc) => doc.required && !doc.fileName);
      if (missingRequired.length > 0) {
        setError(`Upload all required documents before continuing: ${missingRequired.map((d) => d.name).join(", ")}.`);
        return false;
      }
      setError(null);
      return true;
    },
  }));

  function handleUpload(key: string, fileName?: string) {
    onChange(
      value.map((doc) =>
        doc.key === key
          ? fileName
            ? { ...doc, fileName, uploadedDate: new Date().toISOString().slice(0, 10), status: "PENDING", rejectionReason: undefined }
            : { ...doc, fileName: undefined, uploadedDate: undefined, status: "PENDING", rejectionReason: undefined }
          : doc
      )
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-fs-3xl font-semibold text-ink">Documents</h2>
        <p className="mt-1 text-fs-base text-muted">
          Documents are verified manually by HR after submission — every upload starts as{" "}
          <span className="font-medium text-ink">PENDING</span>.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {value.map((doc) => (
          <div key={doc.key} className="rounded-xl border border-border bg-surface-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <FileText className="size-4" />
                </span>
                <div>
                  <p className="text-fs-lg font-medium text-ink">{doc.name}</p>
                  <p className="text-fs-sm text-muted-light">{doc.required ? "Required" : "Optional"}</p>
                </div>
              </div>
              {doc.fileName && <Badge tone={STATUS_TONE[doc.status]}>{doc.status}</Badge>}
            </div>

            <div className="mt-3">
              <FileUploadField
                accept="image/*,.pdf"
                value={doc.fileName ? { fileName: doc.fileName } : undefined}
                onChange={(file) => handleUpload(doc.key, file?.fileName)}
              />
            </div>

            {doc.uploadedDate && (
              <p className="mt-2 text-fs-sm text-muted-light">Uploaded on {doc.uploadedDate}</p>
            )}
            {doc.status === "REJECTED" && doc.rejectionReason && (
              <p className="mt-2 text-fs-sm text-danger">Rejected: {doc.rejectionReason}</p>
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-fs-sm text-danger">{error}</p>}
    </div>
  );
});
