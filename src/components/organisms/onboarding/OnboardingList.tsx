"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Pencil, PlayCircle, PowerOff, ShieldCheck, UserPlus, Users } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { SearchInput } from "@/components/molecules/SearchInput";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { Table, type TableColumn } from "@/components/molecules/Table";
import { useRBAC } from "@/hooks/use-rbac";
import { getOnboardingRecords } from "@/services/onboarding.service";
import { ROLE_LABELS } from "@/types/user";
import {
  documentOverallStatus,
  employeeFullName,
  ONBOARDING_STATUS_LABELS,
  type OnboardingRecord,
  type OnboardingStatus,
} from "@/types/onboarding";

const STATUS_FILTER_OPTIONS: { label: string; value: string }[] = [
  { label: "Draft", value: "draft" },
  { label: "Pending Verification", value: "pending_verification" },
  { label: "Verified", value: "verified" },
  { label: "Rejected", value: "rejected" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const STATUS_TONE: Record<OnboardingStatus, "neutral" | "warning" | "success" | "danger"> = {
  draft: "neutral",
  pending_verification: "warning",
  verified: "success",
  active: "success",
  inactive: "neutral",
};

const ACCOUNT_STATUS_LABEL: Record<OnboardingStatus, string> = {
  draft: "Not Activated",
  pending_verification: "Not Activated",
  verified: "Not Activated",
  active: "Active",
  inactive: "Inactive",
};

export function OnboardingList() {
  const router = useRouter();
  const { can } = useRBAC();
  const [records, setRecords] = useState<OnboardingRecord[] | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    let isMounted = true;
    getOnboardingRecords().then((result) => {
      if (isMounted) setRecords(result);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!records) return [];
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      const name = employeeFullName(record.basicInfo).toLowerCase();
      const matchesQuery =
        !query ||
        name.includes(query) ||
        record.contactInfo.email.toLowerCase().includes(query) ||
        record.professionalInfo.department.toLowerCase().includes(query) ||
        (record.employeeId ?? "").toLowerCase().includes(query);

      const matchesStatus =
        !statusFilter ||
        (statusFilter === "rejected" ? documentOverallStatus(record) === "Rejected" : record.status === statusFilter);

      return matchesQuery && matchesStatus;
    });
  }, [records, search, statusFilter]);

  const columns: TableColumn<OnboardingRecord>[] = [
    {
      key: "name",
      header: "Employee Name",
      render: (record) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={employeeFullName(record.basicInfo) || "New Hire"} imageUrl={record.basicInfo.profilePictureUrl} size="sm" />
          <span className="font-medium text-ink">{employeeFullName(record.basicInfo) || "Unnamed Candidate"}</span>
        </div>
      ),
    },
    { key: "email", header: "Email", render: (record) => record.contactInfo.email || "—" },
    { key: "department", header: "Department", render: (record) => record.professionalInfo.department || "—" },
    { key: "designation", header: "Designation", render: (record) => record.professionalInfo.designation || "—" },
    { key: "role", header: "Assigned Role", render: (record) => ROLE_LABELS[record.roleAccess.role] },
    { key: "employeeId", header: "Employee ID", render: (record) => record.employeeId ?? "—" },
    {
      key: "onboardingStatus",
      header: "Onboarding Status",
      render: (record) => <Badge tone={STATUS_TONE[record.status]}>{ONBOARDING_STATUS_LABELS[record.status]}</Badge>,
    },
    {
      key: "documentStatus",
      header: "Document Status",
      render: (record) => {
        const status = documentOverallStatus(record);
        return <Badge tone={status === "Verified" ? "success" : status === "Rejected" ? "danger" : "warning"}>{status}</Badge>;
      },
    },
    {
      key: "accountStatus",
      header: "Account Status",
      render: (record) => (
        <Badge tone={record.status === "active" ? "success" : record.status === "inactive" ? "danger" : "neutral"}>
          {ACCOUNT_STATUS_LABEL[record.status]}
        </Badge>
      ),
    },
    { key: "createdAt", header: "Created Date", render: (record) => record.createdAt.slice(0, 10) },
    {
      key: "actions",
      header: "Actions",
      render: (record) => (
        <div className="flex flex-wrap gap-1.5">
          {can("employeeOnboarding", "view") && (
            <Button variant="ghost" size="sm" onClick={() => router.push(`/employees/onboarding/${record.id}`)}>
              <Eye className="size-3.5" />
              View
            </Button>
          )}
          {record.status === "draft" && can("employeeOnboarding", "edit") && (
            <Button variant="ghost" size="sm" onClick={() => router.push(`/employees/onboarding/${record.id}`)}>
              <PlayCircle className="size-3.5" />
              Continue
            </Button>
          )}
          {record.status !== "draft" && can("employeeOnboarding", "edit") && (
            <Button variant="ghost" size="sm" onClick={() => router.push(`/employees/onboarding/${record.id}?mode=edit`)}>
              <Pencil className="size-3.5" />
              Edit
            </Button>
          )}
          {record.status === "pending_verification" && can("employeeOnboarding", "verifyDocuments") && (
            <Button variant="ghost" size="sm" onClick={() => router.push(`/employees/onboarding/${record.id}/verify`)}>
              <ShieldCheck className="size-3.5" />
              Verify
            </Button>
          )}
          {record.status === "verified" && can("employeeOnboarding", "activate") && (
            <Button variant="ghost" size="sm" onClick={() => router.push(`/employees/onboarding/${record.id}`)}>
              <PlayCircle className="size-3.5" />
              Activate
            </Button>
          )}
          {record.status === "active" && can("employeeOnboarding", "activate") && (
            <Button variant="ghost" size="sm" onClick={() => router.push(`/employees/onboarding/${record.id}`)}>
              <PowerOff className="size-3.5" />
              Deactivate
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (!records) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted">
        <Spinner />
        Loading onboarding records…
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-surface-card p-4 sm:flex-row">
        <SearchInput
          placeholder="Search by name, email, department, Employee ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:flex-1"
        />
        <FilterDropdown
          label="All Statuses"
          options={STATUS_FILTER_OPTIONS}
          value={statusFilter}
          onChange={setStatusFilter}
          className="sm:w-56"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface-card px-6 py-20 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Users className="size-7" />
          </span>
          <h2 className="text-fs-4xl font-semibold text-ink">No onboarding records found</h2>
          <p className="max-w-md text-fs-lg text-muted">
            {records.length === 0
              ? "Start onboarding a new hire to see them listed here."
              : "Try a different search term or status filter."}
          </p>
          {can("employeeOnboarding", "add") && records.length === 0 && (
            <Button onClick={() => router.push("/employees/onboarding/new")}>
              <UserPlus className="size-4" />
              Add Employee
            </Button>
          )}
        </div>
      ) : (
        <Table columns={columns} data={filtered} keyField={(record) => record.id} />
      )}
    </div>
  );
}
