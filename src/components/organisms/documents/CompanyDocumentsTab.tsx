"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Download, Pencil } from "lucide-react";
import { Table } from "@/components/molecules/Table";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { ConfirmModal } from "@/components/molecules/ConfirmModal";
import { AddCompanyDocumentForm, type AddCompanyDocumentValues } from "@/components/organisms/documents/AddCompanyDocumentForm";
import { EditDocumentModal, type EditDocumentValues } from "@/components/organisms/documents/EditDocumentModal";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/use-rbac";
import {
  deleteCompanyDocument,
  downloadCompanyDocument,
  getCompanyDocuments,
  publishCompanyDocument,
  updateCompanyDocument,
} from "@/services/company-document.service";
import type { CompanyDocument } from "@/types/company-document";

export function CompanyDocumentsTab() {
  const { showToast } = useToast();
  const { can } = useRBAC();
  const [documents, setDocuments] = useState<CompanyDocument[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CompanyDocument | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CompanyDocument | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Publishing/removing a *company-wide* document is a management action, distinct
  // from the personal "add" every self-service role has for their own documents —
  // gate it on "edit"/"delete" so only HR-tier roles (who get full document CRUD)
  // can touch the shared repository.
  const canManage = can("documents", "edit");
  const canDelete = can("documents", "delete");

  const load = useCallback(() => {
    getCompanyDocuments().then(setDocuments);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(values: AddCompanyDocumentValues) {
    setIsSubmitting(true);
    try {
      await publishCompanyDocument(values);
      showToast("Document published for the company.");
      setFormOpen(false);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not publish this document.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEdit(values: EditDocumentValues) {
    if (!editTarget) return;
    setIsSubmitting(true);
    try {
      await updateCompanyDocument(editTarget.id, values);
      showToast("Document updated.");
      setEditTarget(null);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update this document.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await deleteCompanyDocument(deleteTarget.id);
      showToast("Document removed.", "info");
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not remove this document.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDownload(doc: CompanyDocument) {
    setDownloadingId(doc.id);
    try {
      await downloadCompanyDocument(doc.id, doc.title);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not download this document.", "error");
    } finally {
      setDownloadingId(null);
    }
  }

  if (!documents) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted">
        <Spinner />
        Loading company documents…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-fs-xl font-semibold text-ink">Company Document Repository</h3>
          <p className="text-fs-sm text-muted">Policies, handbooks, and forms available to everyone.</p>
        </div>
        {canManage && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="size-4" />
            Add Document
          </Button>
        )}
      </div>

      <Table
        columns={[
          { key: "title", header: "Title", render: (d: CompanyDocument) => <span className="font-medium text-ink">{d.title}</span> },
          { key: "category", header: "Category", render: (d: CompanyDocument) => <Badge tone="neutral">{d.category}</Badge> },
          { key: "uploadedBy", header: "Uploaded By", render: (d: CompanyDocument) => d.uploadedBy },
          {
            key: "uploadedOn",
            header: "Uploaded On",
            render: (d: CompanyDocument) =>
              d.uploadedOn ? new Date(d.uploadedOn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—",
          },
          { key: "size", header: "Size", render: (d: CompanyDocument) => (d.sizeKb ? `${d.sizeKb} KB` : "—") },
          {
            key: "actions",
            header: "",
            render: (d: CompanyDocument) => (
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Download"
                  onClick={() => handleDownload(d)}
                  isLoading={downloadingId === d.id}
                >
                  <Download className="size-4" />
                </Button>
                {canManage && (
                  <Button variant="ghost" size="sm" aria-label="Edit document" onClick={() => setEditTarget(d)}>
                    <Pencil className="size-4" />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger hover:bg-danger-bg"
                    aria-label="Delete document"
                    onClick={() => setDeleteTarget(d)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            ),
          },
        ]}
        data={documents}
        keyField={(d) => d.id}
        emptyMessage="No company documents published yet."
      />

      <AddCompanyDocumentForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleAdd} isSubmitting={isSubmitting} />
      <EditDocumentModal
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        document={editTarget}
        onSubmit={handleEdit}
        isSubmitting={isSubmitting}
      />
      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove this document?"
        description={deleteTarget?.title}
        body="This can't be undone."
        confirmLabel="Remove"
        isConfirming={isSubmitting}
      />
    </div>
  );
}
