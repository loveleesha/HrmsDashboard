"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, RefreshCw, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { SearchInput } from "@/components/molecules/SearchInput";
import { Spinner } from "@/components/atoms/Spinner";
import { Table } from "@/components/molecules/Table";
import { DsrFilterBar, EMPTY_DSR_FILTERS, type DsrFilters } from "@/components/organisms/dsr/DsrFilterBar";
import { CreateDsrPanel, type CreateDsrValues } from "@/components/organisms/dsr/CreateDsrPanel";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/use-rbac";
import { getDsrEntries, newDsrId } from "@/services/dsr.service";
import { getEmployees } from "@/services/employee.service";
import type { DsrEntry, DsrStatus } from "@/types/dsr";
import type { Employee } from "@/types/employee";

const STATUS_TONE: Record<DsrStatus, "success" | "warning" | "danger" | "info"> = {
  Approved: "success",
  Pending: "warning",
  "Pending - Short Leave": "info",
  Rejected: "danger",
};

export default function DsrPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { can } = useRBAC();

  const [entries, setEntries] = useState<DsrEntry[] | null>(null);
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [filters, setFilters] = useState<DsrFilters>(EMPTY_DSR_FILTERS);
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const canApprove = can("dsr", "approve");

  useEffect(() => {
    let isMounted = true;
    Promise.all([getDsrEntries(), getEmployees()]).then(([dsrData, employeeData]) => {
      if (!isMounted) return;
      setEntries(dsrData);
      setEmployees(employeeData);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  function loadData() {
    setEntries(null);
    Promise.all([getDsrEntries(), getEmployees()]).then(([dsrData, employeeData]) => {
      setEntries(dsrData);
      setEmployees(employeeData);
    });
  }

  const currentEmployee = employees?.find((e) => e.email === user?.email) ?? employees?.[0] ?? null;

  const visibleEntries = useMemo(() => {
    if (!entries || !currentEmployee) return [];
    let list = canApprove ? entries : entries.filter((e) => e.employeeId === currentEmployee.id);

    if (filters.fromDate) list = list.filter((e) => e.date >= filters.fromDate);
    if (filters.toDate) list = list.filter((e) => e.date <= filters.toDate);
    if (filters.status) list = list.filter((e) => e.status === filters.status);
    if (filters.project) list = list.filter((e) => e.project === filters.project);
    if (search.trim()) {
      const query = search.trim().toLowerCase();
      list = list.filter(
        (e) => e.employeeName.toLowerCase().includes(query) || e.project.toLowerCase().includes(query)
      );
    }
    return list;
  }, [entries, currentEmployee, canApprove, filters, search]);

  function handleSubmit(values: CreateDsrValues) {
    if (!currentEmployee) return;
    const newEntry: DsrEntry = {
      id: newDsrId(),
      employeeId: currentEmployee.id,
      employeeName: currentEmployee.name,
      email: currentEmployee.email,
      employmentType: "Permanent",
      project: values.project,
      date: values.date,
      estimatedHours: values.estimatedHours,
      noWorkDone: values.noWorkDone,
      usedAiTools: values.usedAiTools,
      description: values.description,
      status: "Pending",
    };
    setEntries((prev) => [newEntry, ...(prev ?? [])]);
    showToast("DSR submitted for approval.");
  }

  function updateStatus(id: string, status: DsrStatus) {
    setEntries((prev) => (prev ?? []).map((e) => (e.id === id ? { ...e, status } : e)));
    showToast(status === "Approved" ? "DSR approved." : "DSR rejected.", status === "Approved" ? "success" : "info");
  }

  return (
    <div>
      <PageHeader
        title="DSR"
        description="Submit and track your daily status reports."
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
            <Button variant="secondary" onClick={loadData}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
          </>
        }
      />

      {filterOpen && <DsrFilterBar filters={filters} onChange={setFilters} />}

      <p className="mb-4 rounded-lg bg-warning-bg px-3 py-2 text-fs-sm text-warning">
        Please Note: You can record any additional hours worked beyond your allocated project hours under the
        &ldquo;Miscellaneous / Bench&rdquo; project.
      </p>

      <CreateDsrPanel onSubmit={handleSubmit} />

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-fs-xl font-semibold text-ink">All Worksheets</h3>
          <p className="text-fs-sm text-muted">Daily status reports overview</p>
        </div>
        <SearchInput
          placeholder="Search by employee or project…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-72"
        />
      </div>

      {!entries || !currentEmployee ? (
        <div className="flex items-center justify-center gap-2 py-24 text-muted">
          <Spinner />
          Loading worksheets…
        </div>
      ) : (
        <Table
          columns={[
            { key: "name", header: "Emp Name", render: (e: DsrEntry) => <span className="font-medium text-ink">{e.employeeName}</span> },
            { key: "empid", header: "EmpId", render: (e: DsrEntry) => e.employeeId },
            { key: "project", header: "Project", render: (e: DsrEntry) => e.project },
            {
              key: "date",
              header: "Date",
              render: (e: DsrEntry) => new Date(e.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
            },
            {
              key: "hours",
              header: "Logged Hr",
              render: (e: DsrEntry) => (e.noWorkDone ? <span className="text-muted-light">No work</span> : e.estimatedHours),
            },
            {
              key: "ai",
              header: "AI Tools",
              render: (e: DsrEntry) =>
                e.usedAiTools ? (
                  <Badge tone="info">
                    <Sparkles className="size-3" />
                    Yes
                  </Badge>
                ) : (
                  <span className="text-muted-light">No</span>
                ),
            },
            {
              key: "status",
              header: "Final Approval",
              render: (e: DsrEntry) => (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={STATUS_TONE[e.status]}>{e.status}</Badge>
                  {canApprove && e.employeeId !== currentEmployee.id && e.status.startsWith("Pending") && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="secondary" onClick={() => updateStatus(e.id, "Approved")}>
                        Approve
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(e.id, "Rejected")}>
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ),
            },
          ]}
          data={visibleEntries}
          keyField={(e) => e.id}
          emptyMessage="No DSR worksheets match your filters."
        />
      )}
    </div>
  );
}
