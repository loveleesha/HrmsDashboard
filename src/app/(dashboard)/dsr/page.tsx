"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Filter, RefreshCw, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { SearchInput } from "@/components/molecules/SearchInput";
import { Tabs } from "@/components/molecules/Tabs";
import { Spinner } from "@/components/atoms/Spinner";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { Table } from "@/components/molecules/Table";
import { DsrFilterBar, EMPTY_DSR_FILTERS, type DsrFilters } from "@/components/organisms/dsr/DsrFilterBar";
import { CreateDsrPanel } from "@/components/organisms/dsr/CreateDsrPanel";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/use-rbac";
import { listAllDsr, listMyDsr, submitDsr } from "@/services/dsr.service";
import type { DsrEntry, SubmitDsrPayload } from "@/types/dsr";

type Scope = "user" | "admin";

export default function DsrPage() {
  const { showToast } = useToast();
  const { can, isAdminAccount } = useRBAC();

  // Admin-tier accounts have no Employee record, so there's no "my own" DSR
  // to submit or view — only "All DSR" applies.
  const canAdd = can("dsr", "add") && !isAdminAccount;
  // Admin > DSR is gated on dsr.approve, not dsr.view (which every role has for its own entries).
  const canSeeAll = can("dsr", "approve");

  const [requestedScope, setScope] = useState<Scope>("user");
  // Force "admin" for admin-tier accounts, but only when they actually have
  // dsr.approve — an admin-tier role without it has neither a "my own" DSR
  // (no Employee record) nor access to "all", so fall through to the normal
  // resolution below rather than forcing a scope listAllDsr() would 403 on.
  const scope: Scope =
    isAdminAccount && canSeeAll ? "admin" : requestedScope === "admin" && canSeeAll ? "admin" : "user";
  const [prevScope, setPrevScope] = useState(scope);
  const [entries, setEntries] = useState<DsrEntry[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [filters, setFilters] = useState<DsrFilters>(EMPTY_DSR_FILTERS);
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  if (scope !== prevScope) {
    setPrevScope(scope);
    setEntries(null);
    setLoadError(null);
  }

  useEffect(() => {
    let isMounted = true;
    (scope === "admin" ? listAllDsr() : listMyDsr())
      .then((data) => {
        if (isMounted) setEntries(data);
      })
      .catch((err) => {
        if (isMounted) setLoadError(err instanceof Error ? err.message : "Could not load worksheets.");
      });
    return () => {
      isMounted = false;
    };
  }, [scope, reloadKey]);

  function reload() {
    setEntries(null);
    setLoadError(null);
    setReloadKey((k) => k + 1);
  }

  async function handleSubmit(payload: SubmitDsrPayload): Promise<boolean> {
    try {
      await submitDsr(payload);
      showToast("DSR submitted.");
      if (scope === "user") reload();
      else setScope("user");
      return true;
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not submit your DSR.", "error");
      return false;
    }
  }

  const projectOptions = useMemo(() => Array.from(new Set((entries ?? []).map((e) => e.project))).sort(), [entries]);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const isAdminScope = scope === "admin";
  const detailHref = (entry: DsrEntry) => `/dsr/${entry.id}${isAdminScope ? "?scope=admin" : ""}`;
  const hasStatus = (entries ?? []).some((e) => e.status);

  const visibleEntries = useMemo(() => {
    let list = entries ?? [];
    if (filters.fromDate) list = list.filter((e) => e.date.slice(0, 10) >= filters.fromDate);
    if (filters.toDate) list = list.filter((e) => e.date.slice(0, 10) <= filters.toDate);
    if (filters.project) list = list.filter((e) => e.project === filters.project);
    const query = search.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (e) =>
          e.project.toLowerCase().includes(query) ||
          e.description.toLowerCase().includes(query) ||
          e.employeeName?.toLowerCase().includes(query)
      );
    }
    return list;
  }, [entries, filters, search]);

  return (
    <div>
      <PageHeader
        title="DSR"
        description={isAdminScope ? "Every employee's daily status reports." : "Submit and track your daily status reports."}
        actions={
          <>
            <Button variant="secondary" onClick={() => setFilterOpen((prev) => !prev)}>
              <Filter className="size-4" />
              Filter
              {activeFilterCount > 0 && (
                <span className="flex size-4 items-center justify-center rounded-full bg-primary text-fs-xs font-semibold text-white">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            <Button variant="secondary" onClick={reload}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
          </>
        }
      />

      {/* Admin-tier accounts have no "My DSR" to switch to — scope is forced
          to "admin" above, so the toggle would just be a single dead option. */}
      {canSeeAll && !isAdminAccount && (
        <div className="mb-4">
          <Tabs
            options={[
              { label: "My DSR", value: "user" },
              { label: "All DSR", value: "admin" },
            ]}
            value={scope}
            onChange={(value) => setScope(value as Scope)}
          />
        </div>
      )}

      {filterOpen && <DsrFilterBar filters={filters} onChange={setFilters} projectOptions={projectOptions} />}

      <p className="mb-4 rounded-lg bg-warning-bg px-3 py-2 text-fs-sm text-warning">
        Please Note: You can log time against the projects you&apos;re assigned to. Anything else goes under
        &ldquo;Miscellaneous&rdquo; — leave the label blank and it&apos;s logged as &ldquo;Internal Project&rdquo;.
      </p>

      {canAdd && <CreateDsrPanel onSubmit={handleSubmit} />}

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-fs-xl font-semibold text-ink">{isAdminScope ? "All Worksheets" : "My Worksheets"}</h3>
          <p className="text-fs-sm text-muted">Daily status reports overview</p>
        </div>
        <SearchInput
          placeholder={isAdminScope ? "Search by employee, project or description…" : "Search by project or description…"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-72"
        />
      </div>

      {loadError ? (
        <p className="rounded-xl border border-dashed border-border bg-surface-card px-6 py-16 text-center text-fs-base text-danger">
          {loadError}
        </p>
      ) : !entries ? (
        <div className="flex items-center justify-center gap-2 py-24 text-muted">
          <Spinner />
          Loading worksheets…
        </div>
      ) : (
        <Table
          columns={[
            ...(isAdminScope
              ? [
                  {
                    key: "name",
                    header: "Employee",
                    render: (e: DsrEntry) => (
                      <div>
                        <p className="font-medium text-ink">{e.employeeName ?? "—"}</p>
                        {e.employeeCode && <p className="text-fs-sm text-muted">{e.employeeCode}</p>}
                      </div>
                    ),
                  },
                ]
              : []),
            {
              key: "date",
              header: "Date",
              render: (e: DsrEntry) => (
                <Link href={detailHref(e)} className="font-medium text-ink hover:text-primary hover:underline">
                  {new Date(e.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </Link>
              ),
            },
            {
              key: "project",
              header: "Project",
              render: (e: DsrEntry) => (
                <span>
                  {e.project}
                  {e.isOtherProject && <span className="ml-1.5 text-fs-sm text-muted-light">(misc.)</span>}
                </span>
              ),
            },
            {
              key: "hours",
              header: "Logged Hr",
              render: (e: DsrEntry) => (e.noWorkDone ? <span className="text-muted-light">No work</span> : e.estimatedHours || "—"),
            },
            {
              key: "ai",
              header: "AI Tools",
              render: (e: DsrEntry) =>
                e.aiToolsUsed ? (
                  <Badge tone="info">
                    <Sparkles className="size-3" />
                    Yes
                  </Badge>
                ) : (
                  <span className="text-muted-light">No</span>
                ),
            },
            {
              key: "description",
              header: "Description",
              className: "max-w-[16rem]",
              render: (e: DsrEntry) => <span className="line-clamp-2 break-words [overflow-wrap:anywhere]">{e.description || "—"}</span>,
            },
            ...(hasStatus ? [{ key: "status", header: "Status", render: (e: DsrEntry) => (e.status ? <StatusBadge status={e.status} /> : "—") }] : []),
            {
              key: "actions",
              header: "",
              headerClassName: "w-24",
              className: "text-right",
              render: (e: DsrEntry) => (
                <Link
                  href={detailHref(e)}
                  className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg border border-border px-3 text-fs-base font-medium text-ink hover:border-border-strong hover:text-primary"
                >
                  <Eye className="size-3.5" />
                  View
                </Link>
              ),
            },
          ]}
          data={visibleEntries}
          keyField={(e) => e.id}
          emptyMessage={entries.length === 0 ? "No DSR worksheets yet." : "No DSR worksheets match your filters."}
        />
      )}
    </div>
  );
}
