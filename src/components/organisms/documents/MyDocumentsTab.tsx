"use client";

import { useEffect, useMemo, useState } from "react";
import { FolderOpen, CheckCircle2, CloudUpload, XCircle, Download, Eye, FileText } from "lucide-react";
import { StatCard } from "@/components/molecules/StatCard";
import { Table } from "@/components/molecules/Table";
import { Spinner } from "@/components/atoms/Spinner";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { fileTypeLabel, formatFileSize, getMyDocuments } from "@/services/document.service";
import type { EmployeeDocument } from "@/types/document";

/** Every document on the signed-in employee's record, with view/download links. */
export function MyDocumentsTab() {
  const [documents, setDocuments] = useState<EmployeeDocument[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getMyDocuments()
      .then((data) => {
        if (isMounted) setDocuments(data);
      })
      .catch((err) => {
        if (isMounted) setLoadError(err instanceof Error ? err.message : "Could not load your documents.");
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

  if (loadError) {
    return <p className="rounded-xl border border-dashed border-border bg-surface-card px-6 py-16 text-center text-fs-base text-danger">{loadError}</p>;
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
        <StatCard label="Pending Review" value={String(counts.pending)} icon={CloudUpload} />
        <StatCard label="Rejected" value={String(counts.rejected)} icon={XCircle} />
      </div>

      <div>
        <h3 className="text-fs-xl font-semibold text-ink">Employee Document Repository</h3>
        <p className="text-fs-sm text-muted">Personal and employment documents on file.</p>
      </div>

      <Table
        columns={[
          {
            key: "name",
            header: "Document",
            render: (d: EmployeeDocument) => (
              <span className="flex items-center gap-2 font-medium text-ink">
                <FileText className="size-4 shrink-0 text-muted-light" />
                {d.name}
              </span>
            ),
          },
          { key: "category", header: "Category", render: (d: EmployeeDocument) => d.category },
          {
            key: "size",
            header: "File Info",
            render: (d: EmployeeDocument) => [formatFileSize(d.sizeBytes), fileTypeLabel(d.mimeType)].filter((part) => part && part !== "—").join(" · ") || "—",
          },
          {
            key: "uploaded",
            header: "Uploaded On",
            render: (d: EmployeeDocument) =>
              d.uploadedOn ? new Date(d.uploadedOn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—",
          },
          { key: "status", header: "Verification Status", render: (d: EmployeeDocument) => <StatusBadge status={d.status} /> },
          {
            key: "actions",
            header: "",
            headerClassName: "w-32",
            className: "text-right",
            render: (d: EmployeeDocument) =>
              d.fileUrl ? (
                <div className="flex justify-end gap-1">
                  <a
                    href={d.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`View ${d.name}`}
                    className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-primary"
                  >
                    <Eye className="size-4" />
                  </a>
                  <a
                    href={d.fileUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Download ${d.name}`}
                    className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-primary"
                  >
                    <Download className="size-4" />
                  </a>
                </div>
              ) : (
                <span className="text-fs-sm text-muted-light">No file</span>
              ),
          },
        ]}
        data={documents}
        keyField={(d) => d.id}
        emptyMessage="No documents are on file for you yet."
      />
    </div>
  );
}
