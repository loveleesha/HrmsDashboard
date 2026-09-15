"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, FileText, XCircle } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/molecules/Modal";
import { RejectDocumentModal } from "@/components/organisms/onboarding/RejectDocumentModal";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/use-rbac";
import { rejectDocument, verifyDocument } from "@/services/onboarding.service";
import { employeeFullName, type OnboardingDocument, type OnboardingRecord } from "@/types/onboarding";
import { ONBOARDING_STATUS_LABELS } from "@/types/onboarding";

export interface DocumentVerificationPanelProps {
  record: OnboardingRecord;
  onRecordChange: (record: OnboardingRecord) => void;
}

const STATUS_TONE = { PENDING: "warning", VERIFIED: "success", REJECTED: "danger" } as const;

export function DocumentVerificationPanel({ record, onRecordChange }: DocumentVerificationPanelProps) {
  const { can } = useRBAC();
  const { showToast } = useToast();
  const router = useRouter();
  const [rejectingDoc, setRejectingDoc] = useState<OnboardingDocument | null>(null);
  const [previewDoc, setPreviewDoc] = useState<OnboardingDocument | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const canVerify = can("employeeOnboarding", "verifyDocuments");

  async function handleVerify(doc: OnboardingDocument) {
    setPendingKey(doc.key);
    try {
      const updated = await verifyDocument(record.id, doc.key);
      onRecordChange(updated);
      showToast(`${doc.name} marked as verified.`);
    } catch {
      showToast("Could not update the document. Please try again.", "error");
    } finally {
      setPendingKey(null);
    }
  }

  async function handleReject(reason: string) {
    if (!rejectingDoc) return;
    setPendingKey(rejectingDoc.key);
    try {
      const updated = await rejectDocument(record.id, rejectingDoc.key, reason);
      onRecordChange(updated);
      showToast(`${rejectingDoc.name} rejected.`, "error");
    } catch {
      showToast("Could not reject the document. Please try again.", "error");
    } finally {
      setPendingKey(null);
      setRejectingDoc(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-border bg-surface-card p-5">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={employeeFullName(record.basicInfo) || "New Hire"} imageUrl={record.basicInfo.profilePictureUrl} size="lg" />
          <div className="flex-1">
            <p className="text-fs-2xl font-semibold text-ink">{employeeFullName(record.basicInfo) || "Unnamed Candidate"}</p>
            <p className="text-fs-base text-muted">{record.basicInfo.email}</p>
          </div>
          <Badge tone={record.status === "verified" ? "success" : "warning"}>{ONBOARDING_STATUS_LABELS[record.status]}</Badge>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
          <div>
            <p className="text-fs-sm text-muted-light">Department</p>
            <p className="text-fs-base text-ink">{record.professionalInfo.department || "—"}</p>
          </div>
          <div>
            <p className="text-fs-sm text-muted-light">Designation</p>
            <p className="text-fs-base text-ink">{record.professionalInfo.designation || "—"}</p>
          </div>
          <div>
            <p className="text-fs-sm text-muted-light">Employee Status</p>
            <p className="text-fs-base text-ink">{ONBOARDING_STATUS_LABELS[record.status]}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {record.documents.map((doc) => (
          <div key={doc.key} className="flex flex-col gap-3 rounded-xl border border-border bg-surface-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <FileText className="size-4" />
                </span>
                <div>
                  <p className="text-fs-lg font-medium text-ink">{doc.name}</p>
                  <p className="text-fs-sm text-muted-light">{doc.required ? "Required" : "Optional"}</p>
                </div>
              </div>
              <Badge tone={STATUS_TONE[doc.status]}>{doc.status}</Badge>
            </div>

            {doc.fileName ? (
              <>
                <p className="text-fs-sm text-muted">
                  {doc.fileName} · Uploaded {doc.uploadedDate ?? "—"}
                </p>
                {doc.status === "REJECTED" && doc.rejectionReason && (
                  <p className="rounded-lg bg-danger-bg px-3 py-2 text-fs-sm text-danger">
                    Rejection reason: {doc.rejectionReason}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setPreviewDoc(doc)}>
                    <Eye className="size-3.5" />
                    Preview
                  </Button>
                  {canVerify && doc.status !== "VERIFIED" && (
                    <Button size="sm" onClick={() => handleVerify(doc)} isLoading={pendingKey === doc.key}>
                      <CheckCircle2 className="size-3.5" />
                      Verify
                    </Button>
                  )}
                  {canVerify && doc.status !== "REJECTED" && (
                    <Button variant="danger" size="sm" onClick={() => setRejectingDoc(doc)} disabled={pendingKey === doc.key}>
                      <XCircle className="size-3.5" />
                      Reject
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <p className="text-fs-sm text-muted-light">Not uploaded yet.</p>
            )}
          </div>
        ))}
      </div>

      {!canVerify && (
        <p className="text-fs-sm text-muted-light">
          Your role can view document status but does not have permission to verify or reject documents.
        </p>
      )}

      <div className="flex justify-end">
        <Button variant="secondary" onClick={() => router.push(`/employees/onboarding/${record.id}`)}>
          Back to Onboarding Overview
        </Button>
      </div>

      <RejectDocumentModal
        open={Boolean(rejectingDoc)}
        documentName={rejectingDoc?.name}
        onClose={() => setRejectingDoc(null)}
        onReject={handleReject}
        isSubmitting={pendingKey === rejectingDoc?.key}
      />

      <Modal open={Boolean(previewDoc)} onClose={() => setPreviewDoc(null)} title={previewDoc?.name ?? "Document Preview"}>
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <span className="flex size-16 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <FileText className="size-8" />
          </span>
          <p className="text-fs-lg font-medium text-ink">{previewDoc?.fileName}</p>
          <p className="text-fs-base text-muted-light">Uploaded {previewDoc?.uploadedDate ?? "—"}</p>
        </div>
      </Modal>
    </div>
  );
}
