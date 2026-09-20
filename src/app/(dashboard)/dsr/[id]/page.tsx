"use client";

import { Suspense, use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, FileSearch, FolderKanban, Sparkles, User } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { useRBAC } from "@/hooks/use-rbac";
import { getDsrEntry } from "@/services/dsr.service";
import type { DsrEntry } from "@/types/dsr";

function formatDate(value: string, long = true) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", long ? { weekday: "long", day: "2-digit", month: "long", year: "numeric" } : { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatHours(value: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return value || "—";
  const [hours, minutes] = [Number(match[1]), Number(match[2])];
  return [hours ? `${hours}h` : "", minutes ? `${minutes}m` : ""].filter(Boolean).join(" ") || "0m";
}

function Detail({ icon: Icon, label, children }: { icon: typeof Clock; label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-fs-sm text-muted-light">{label}</p>
        <div className="break-words text-fs-lg font-medium text-ink [overflow-wrap:anywhere]">{children}</div>
      </div>
    </div>
  );
}

function DsrDetail({ id }: { id: string }) {
  const { can } = useRBAC();
  const searchParams = useSearchParams();
  const scope = searchParams.get("scope") === "admin" && can("dsr", "approve") ? "admin" : "user";
  const [entry, setEntry] = useState<DsrEntry | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getDsrEntry(id, scope)
      .then((data) => {
        if (isMounted) setEntry(data ?? null);
      })
      .catch((err) => {
        if (isMounted) setLoadError(err instanceof Error ? err.message : "Could not load this DSR.");
      });
    return () => {
      isMounted = false;
    };
  }, [id, scope]);

  if (loadError) {
    return <p className="rounded-xl border border-dashed border-border bg-surface-card px-6 py-16 text-center text-fs-base text-danger">{loadError}</p>;
  }

  if (entry === undefined) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted">
        <Spinner />
        Loading DSR…
      </div>
    );
  }

  if (entry === null) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface-card px-6 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-warning-bg text-warning">
          <FileSearch className="size-7" />
        </span>
        <h2 className="text-fs-2xl font-semibold text-ink">DSR not found</h2>
        <p className="max-w-md text-fs-base text-muted">It may have been removed, or it belongs to someone else.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-surface-card p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-fs-sm font-medium uppercase tracking-wide text-primary">Daily Status Report</p>
            <h2 className="mt-1 text-fs-4xl font-semibold text-ink">{formatDate(entry.date)}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {entry.noWorkDone && <Badge tone="warning">No work done</Badge>}
            {entry.status && <StatusBadge status={entry.status} />}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {entry.employeeName && (
            <Detail icon={User} label="Employee">
              {entry.employeeName}
              {entry.employeeCode && <span className="ml-1.5 text-fs-base font-normal text-muted">({entry.employeeCode})</span>}
            </Detail>
          )}
          <Detail icon={FolderKanban} label="Project">
            {entry.project}
            {entry.isOtherProject && <span className="ml-1.5 text-fs-base font-normal text-muted-light">(miscellaneous)</span>}
          </Detail>
          <Detail icon={Clock} label="Time logged">
            {entry.noWorkDone ? "No work" : formatHours(entry.estimatedHours)}
            {!entry.noWorkDone && entry.estimatedHours && <span className="ml-1.5 text-fs-base font-normal text-muted">({entry.estimatedHours})</span>}
          </Detail>
          <Detail icon={Sparkles} label="AI tools used">
            {entry.aiToolsUsed ? "Yes" : "No"}
          </Detail>
          <Detail icon={CalendarDays} label="Submitted">
            {formatDateTime(entry.createdAt)}
          </Detail>
          {entry.updatedAt && entry.updatedAt !== entry.createdAt && (
            <Detail icon={CalendarDays} label="Last updated">
              {formatDateTime(entry.updatedAt)}
            </Detail>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-card p-5 sm:p-6">
        <h3 className="mb-3 text-fs-xl font-semibold text-ink">Description</h3>
        {entry.description ? (
          <p className="whitespace-pre-wrap break-words text-fs-lg leading-relaxed text-ink [overflow-wrap:anywhere]">{entry.description}</p>
        ) : (
          <p className="text-fs-base text-muted">{entry.noWorkDone ? "No description — no work was done that day." : "No description was added."}</p>
        )}
      </div>
    </div>
  );
}

export default function DsrDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  return (
    <div>
      <PageHeader
        title="DSR Details"
        description="The full worksheet, exactly as it was submitted."
        actions={
          <Button variant="secondary" size="sm" onClick={() => router.push("/dsr")}>
            <ArrowLeft className="size-4" />
            Back to DSR
          </Button>
        }
      />
      <Suspense
        fallback={
          <div className="flex items-center justify-center gap-2 py-24 text-muted">
            <Spinner />
            Loading…
          </div>
        }
      >
        <DsrDetail id={id} />
      </Suspense>
    </div>
  );
}
