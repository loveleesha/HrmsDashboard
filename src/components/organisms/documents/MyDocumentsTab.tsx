"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, FolderOpen, CheckCircle2, CloudUpload, XCircle, Download } from "lucide-react";
import { StatCard } from "@/components/molecules/StatCard";
import { Table } from "@/components/molecules/Table";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { UploadDocumentForm, type UploadDocumentValues } from "@/components/organisms/documents/UploadDocumentForm";
import { useToast } from "@/hooks/use-toast";
import { getMyDocuments } from "@/services/document.service";
import type { EmployeeDocument } from "@/types/document";

export function MyDocumentsTab() {
  const { showToast } = useToast();
  const [documents, setDocuments] = useState<EmployeeDocument[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getMyDocuments().then((data) => {
      if (isMounted) setDocuments(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const counts = useMemo(() => {
    const list = documents ?? [];
    return {
      total: list.length,
      verified: list.filter((d) => d.status === "Verified").length,
      pending: list.filter((d) => d.status === "Pending Review").length,
      rejected: list.filter((d) => d.status === "Rejected").length,
    };
  }, [documents]);

  function handleUpload(values: UploadDocumentValues) {
    const newDoc: EmployeeDocument = {
      id: `DOC-${Math.floor(10 + Math.random() * 89)}`,
      name: values.name,
      category: values.category,
      uploadedOn: new Date().toISOString().slice(0, 10),
      status: "Pending Review",
      sizeKb: Math.floor(80 + Math.random() * 300),
    };
    setDocuments((prev) => [newDoc, ...(prev ?? [])]);
    setFormOpen(false);
    showToast("Document uploaded. It's pending HR verification.");
  }

  if (!documents) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted">
        <Spinner />
        Loading documents…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Documents" value={String(counts.total)} icon={FolderOpen} />
        <StatCard label="Verified" value={String(counts.verified)} icon={CheckCircle2} />
        <StatCard label="Uploaded / Pending" value={String(counts.pending)} icon={CloudUpload} />
        <StatCard label="Rejected" value={String(counts.rejected)} icon={XCircle} />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-fs-xl font-semibold text-ink">Employee Document Repository</h3>
          <p className="text-fs-sm text-muted">Personal and employment documents on file.</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="size-4" />
          Upload Document
        </Button>
      </div>

      <Table
        columns={[
          { key: "name", header: "Document Title & Type", render: (d: EmployeeDocument) => <span className="font-medium text-ink">{d.name}</span> },
          { key: "category", header: "Category", render: (d: EmployeeDocument) => d.category },
          { key: "size", header: "File Info", render: (d: EmployeeDocument) => `${d.sizeKb} KB` },
          {
            key: "uploaded",
            header: "Uploaded On",
            render: (d: EmployeeDocument) => new Date(d.uploadedOn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
          },
          { key: "status", header: "Verification Status", render: (d: EmployeeDocument) => <StatusBadge status={d.status} /> },
          {
            key: "actions",
            header: "Actions",
            render: () => (
              <Button variant="ghost" size="sm" aria-label="Download">
                <Download className="size-4" />
              </Button>
            ),
          },
        ]}
        data={documents}
        keyField={(d) => d.id}
        emptyMessage='No uploaded documents found. Use the "Upload Document" button above to upload files.'
      />

      <UploadDocumentForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleUpload} />
    </div>
  );
}
