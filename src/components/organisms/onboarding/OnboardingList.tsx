"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlayCircle, Trash2, UserPlus, Users } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { SearchInput } from "@/components/molecules/SearchInput";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { ActionMenu } from "@/components/molecules/ActionMenu";
import { ConfirmModal } from "@/components/molecules/ConfirmModal";
import { Table, type TableColumn } from "@/components/molecules/Table";
import { useRBAC } from "@/hooks/use-rbac";
import { useRoles } from "@/hooks/use-roles";
import { useToast } from "@/hooks/use-toast";
import { discardOnboarding, getOnboardingRecords } from "@/services/onboarding.service";
import { DEPARTMENTS } from "@/types/employee";
import { ONBOARDING_STEP_KEYS, employeeFullName, type OnboardingRecord } from "@/types/onboarding";

export function OnboardingList() {
  const router = useRouter();
  const { can } = useRBAC();
  const { getRoleLabel } = useRoles();
  const { showToast } = useToast();
  const [records, setRecords] = useState<OnboardingRecord[] | null>(null);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [discardTarget, setDiscardTarget] = useState<OnboardingRecord | null>(null);
  const [isDiscarding, setIsDiscarding] = useState(false);

  // Search and department are real server-side filters (see
  // employee.service.ts's listEmployeesRemote) — debounce the search input
  // so it doesn't refetch on every keystroke.
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      getOnboardingRecords({ search: search.trim() || undefined, department: department || undefined }).then(
        (result) => {
          if (isMounted) setRecords(result);
        }
      );
    }, 300);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [search, department]);

  async function handleDiscardConfirmed() {
    if (!discardTarget) return;
    setIsDiscarding(true);
    try {
      await discardOnboarding(discardTarget.id);
      setRecords((prev) => prev?.filter((r) => r.id !== discardTarget.id) ?? prev);
      showToast(`Discarded ${employeeFullName(discardTarget.basicInfo) || "this"} onboarding.`);
      setDiscardTarget(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not discard this onboarding.", "error");
    } finally {
      setIsDiscarding(false);
    }
  }

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
    { key: "email", header: "Email", render: (record) => record.basicInfo.email || "—" },
    { key: "department", header: "Department", render: (record) => record.professionalInfo.department || "—" },
    { key: "designation", header: "Designation", render: (record) => record.professionalInfo.designation || "—" },
    { key: "role", header: "Assigned Role", render: (record) => getRoleLabel(record.roleAccess.role) },
    { key: "employeeId", header: "Employee ID", render: (record) => record.employeeId ?? "—" },
    {
      key: "progress",
      header: "Progress",
      render: (record) => (
        <Badge tone="warning">
          Step {Math.min(record.currentStepIndex + 1, ONBOARDING_STEP_KEYS.length)} of {ONBOARDING_STEP_KEYS.length}
        </Badge>
      ),
    },
    { key: "createdAt", header: "Created Date", render: (record) => record.createdAt.slice(0, 10) },
    {
      key: "actions",
      header: "",
      headerClassName: "w-10",
      className: "text-right",
      render: (record) => (
        <div className="flex justify-end">
          <ActionMenu
            ariaLabel={`Actions for ${employeeFullName(record.basicInfo) || "this record"}`}
            items={[
              {
                label: "Continue Setup",
                icon: PlayCircle,
                onClick: () => router.push(`/employees/onboarding/${record.id}`),
                hidden: !can("employeeOnboarding", "view"),
              },
              {
                label: "Discard",
                icon: Trash2,
                tone: "danger",
                onClick: () => setDiscardTarget(record),
                hidden: !can("employeeOnboarding", "delete"),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  const hasActiveFilters = Boolean(search || department);

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
          placeholder="Search by name, email, department, Employee ID, role…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:flex-1"
        />
        <FilterDropdown
          label="Department"
          options={DEPARTMENTS.map((d) => ({ label: d, value: d }))}
          value={department}
          onChange={setDepartment}
          className="sm:w-48"
        />
      </div>

      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface-card px-6 py-20 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Users className="size-7" />
          </span>
          <h2 className="text-fs-4xl font-semibold text-ink">No onboarding records found</h2>
          <p className="max-w-md text-fs-lg text-muted">
            {hasActiveFilters
              ? "Try a different search term or department."
              : "Start onboarding a new hire to see them listed here."}
          </p>
          {can("employeeOnboarding", "add") && !hasActiveFilters && (
            <Button onClick={() => router.push("/employees/onboarding/new")}>
              <UserPlus className="size-4" />
              Add Employee
            </Button>
          )}
        </div>
      ) : (
        <Table columns={columns} data={records} keyField={(record) => record.id} />
      )}

      <ConfirmModal
        open={Boolean(discardTarget)}
        onClose={() => setDiscardTarget(null)}
        onConfirm={handleDiscardConfirmed}
        title="Discard Onboarding"
        description={discardTarget ? employeeFullName(discardTarget.basicInfo) || "Unnamed candidate" : undefined}
        body="This permanently deletes this onboarding record, including the account it created, and can't be undone."
        confirmLabel="Discard Onboarding"
        isConfirming={isDiscarding}
      />
    </div>
  );
}
