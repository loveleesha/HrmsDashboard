"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, FileText } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/molecules/Modal";
import { SearchInput } from "@/components/molecules/SearchInput";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { Table } from "@/components/molecules/Table";
import { Spinner } from "@/components/atoms/Spinner";
import { listPendingDocumentReviews, type PendingReview } from "@/services/document-review.service";

export function PendingReviewList() {
  const [reviews, setReviews] = useState<PendingReview[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    listPendingDocumentReviews()
      .then((data) => {
        if (isMounted) setReviews(data);
      })
      .catch((err) => {
        if (isMounted) setLoadError(err instanceof Error ? err.message : "Could not load the review queue.");
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (reviews ?? []).filter(
      (r) =>
        !query ||
        r.employee.name.toLowerCase().includes(query) ||
        r.employee.email.toLowerCase().includes(query) ||
        r.employee.employeeId?.toLowerCase().includes(query) ||
        r.employee.department.toLowerCase().includes(query)
    );
  }, [reviews, search]);

  const opened = reviews?.find((r) => r.employee.id === openId);

  if (loadError) {
    return <p className="rounded-xl border border-dashed border-border bg-surface-card px-6 py-16 text-center text-fs-base text-danger">{loadError}</p>;
  }

  if (!reviews) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted">
        <Spinner />
        Checking employees&apos; documents…
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 rounded-xl border border-border bg-surface-card p-4">
        <SearchInput placeholder="Search by name, email, department, Employee ID…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface-card px-6 py-20 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-success-bg text-success">
            <CheckCircle2 className="size-7" />
          </span>
          <h2 className="text-fs-4xl font-semibold text-ink">Nothing waiting for review</h2>
          <p className="max-w-md text-fs-lg text-muted">Every uploaded document has already been reviewed.</p>
        </div>
      ) : (
        <Table
          columns={[
            {
              key: "employee",
              header: "Employee",
              render: (r: PendingReview) => (
                <div className="flex items-center gap-2.5">
                  <Avatar name={r.employee.name} imageUrl={r.employee.avatarUrl} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{r.employee.name}</p>
                    <p className="truncate text-fs-sm text-muted">{r.employee.email}</p>
                  </div>
                </div>
              ),
            },
            { key: "employeeId", header: "Employee ID", render: (r: PendingReview) => r.employee.employeeId ?? "—" },
            { key: "department", header: "Department", render: (r: PendingReview) => r.employee.department || "—" },
            {
              key: "pending",
              header: "Awaiting Review",
              render: (r: PendingReview) => (
                <Badge tone="warning">
                  {r.pendingDocuments.length} of {r.profile.documents.length} documents
                </Badge>
              ),
            },
            {
              key: "actions",
              header: "",
              className: "text-right",
              render: (r: PendingReview) => (
                <Button variant="secondary" size="sm" onClick={() => setOpenId(r.employee.id)}>
                  <Eye className="size-3.5" />
                  View Documents
                </Button>
              ),
            },
          ]}
          data={visible}
          keyField={(r) => r.employee.id}
          emptyMessage="No one matches your search."
        />
      )}

      {opened && (
        <Modal
          open
          onClose={() => setOpenId(null)}
          title="Documents"
          description={`${opened.employee.name}${opened.employee.employeeId ? ` · ${opened.employee.employeeId}` : ""}`}
          widthClassName="sm:max-w-xl"
        >
          <div className="flex flex-col gap-2">
            {opened.profile.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-fs-base font-medium text-ink">
                    <FileText className="size-4 shrink-0 text-muted-light" />
                    <span className="truncate">{doc.name}</span>
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    {doc.verificationStatus && <StatusBadge status={doc.verificationStatus} />}
                    {doc.category && <span className="text-fs-sm text-muted-light">{doc.category}</span>}
                  </div>
                </div>
                {doc.fileUrl ? (
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-fs-sm text-primary hover:underline">
                    Open
                  </a>
                ) : (
                  <span className="text-fs-sm text-muted-light">No file</span>
                )}
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
