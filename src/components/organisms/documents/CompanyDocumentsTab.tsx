"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Download } from "lucide-react";
import { Table } from "@/components/molecules/Table";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { AddCompanyDocumentForm, type AddCompanyDocumentValues } from "@/components/organisms/documents/AddCompanyDocumentForm";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/use-rbac";
import { getCompanyDocuments, newCompanyDocumentId } from "@/services/company-document.service";
import type { CompanyDocument } from "@/types/company-document";

export function CompanyDocumentsTab() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { can } = useRBAC();
  const [documents, setDocuments] = useState<CompanyDocument[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  // Publishing/removing a *company-wide* document is a management action, distinct
  // from the personal "add" every self-service role has for their own documents —
  // gate it on "edit"/"delete" so only HR-tier roles (who get full document CRUD)
  // can touch the shared repository.
  const canManage = can("documents", "edit");
  const canDelete = can("documents", "delete");

  useEffect(() => {
    let isMounted = true;
    getCompanyDocuments().then((data) => {
      if (isMounted) setDocuments(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  function handleAdd(values: AddCompanyDocumentValues) {
    const newDoc: CompanyDocument = {
      id: newCompanyDocumentId(),
      title: values.title,
      category: values.category,
      uploadedBy: user?.name ?? "HR",
      uploadedOn: new Date().toISOString().slice(0, 10),
      sizeKb: Math.floor(80 + Math.random() * 400),
    };
    setDocuments((prev) => [newDoc, ...(prev ?? [])]);
    setFormOpen(false);
    showToast("Document published for the company.");
  }

  function handleDelete(id: string) {
    setDocuments((prev) => (prev ?? []).filter((d) => d.id !== id));
    showToast("Document removed.", "info");
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
            render: (d: CompanyDocument) => new Date(d.uploadedOn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
          },
          { key: "size", header: "Size", render: (d: CompanyDocument) => `${d.sizeKb} KB` },
          {
            key: "actions",
            header: "",
            render: (d: CompanyDocument) => (
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="sm" aria-label="Download">
                  <Download className="size-4" />
                </Button>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger hover:bg-danger-bg"
                    aria-label="Delete document"
                    onClick={() => handleDelete(d.id)}
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

      <AddCompanyDocumentForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleAdd} />
    </div>
  );
}
