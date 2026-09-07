"use client";

import { useEffect, useMemo, useState } from "react";
import { Repeat, Check, X } from "lucide-react";
import { FormField } from "@/components/molecules/FormField";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { Textarea } from "@/components/atoms/Textarea";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/use-rbac";
import { getDepartmentChangeRequests, newDepartmentChangeId } from "@/services/department-change.service";
import { DEPARTMENTS } from "@/types/employee";
import type { Employee } from "@/types/employee";
import type { DepartmentChangeRequest } from "@/types/department-change";

export function DepartmentChangeTab({ employee }: { employee: Employee }) {
  const { showToast } = useToast();
  const { can } = useRBAC();
  const canManage = can("employees", "edit");

  const [requests, setRequests] = useState<DepartmentChangeRequest[] | null>(null);
  const [requestedDepartment, setRequestedDepartment] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getDepartmentChangeRequests().then((data) => {
      if (isMounted) setRequests(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const myRequests = useMemo(
    () => (requests ?? []).filter((r) => r.employeeId === employee.id),
    [requests, employee.id]
  );
  const hasPending = myRequests.some((r) => r.status === "Pending");

  function handleSubmit() {
    if (!requestedDepartment) {
      setError("Select the department you'd like to move to.");
      return;
    }
    if (requestedDepartment === employee.department) {
      setError("You're already in this department.");
      return;
    }
    if (!reason.trim()) {
      setError("Add a short reason for the request.");
      return;
    }

    const newRequest: DepartmentChangeRequest = {
      id: newDepartmentChangeId(),
      employeeId: employee.id,
      employeeName: employee.name,
      currentDepartment: employee.department,
      requestedDepartment,
      reason: reason.trim(),
      status: "Pending",
      requestedOn: new Date().toISOString().slice(0, 10),
    };
    setRequests((prev) => [newRequest, ...(prev ?? [])]);
    setRequestedDepartment("");
    setReason("");
    setError(null);
    showToast("Department change request submitted.");
  }

  function updateStatus(id: string, status: DepartmentChangeRequest["status"]) {
    setRequests((prev) => (prev ?? []).map((r) => (r.id === id ? { ...r, status } : r)));
    showToast(status === "Approved" ? "Request approved." : "Request rejected.", status === "Approved" ? "success" : "info");
  }

  if (!requests) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted">
        <Spinner />
        Loading department change requests…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-surface-card p-5">
        <h3 className="mb-1 flex items-center gap-2 text-fs-xl font-semibold text-ink">
          <Repeat className="size-4 text-primary" />
          Request Department Change
        </h3>
        <p className="mb-4 text-fs-sm text-muted">
          Currently in <span className="font-medium text-ink">{employee.department}</span>. Submit a request to
          move to a different department — your manager and HR will review it.
        </p>

        {hasPending ? (
          <p className="rounded-lg bg-warning-bg px-3 py-2 text-fs-base text-warning">
            You already have a pending department change request.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <FormField label="Requested Department" htmlFor="dept-requested" error={error ?? undefined} required>
              <FilterDropdown
                label="Select Department"
                options={DEPARTMENTS.filter((d) => d !== employee.department).map((d) => ({ label: d, value: d }))}
                value={requestedDepartment}
                onChange={setRequestedDepartment}
              />
            </FormField>
            <FormField label="Reason" htmlFor="dept-reason" required>
              <Textarea id="dept-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
            </FormField>
            <Button onClick={handleSubmit} className="self-start">
              Submit Request
            </Button>
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-fs-xl font-semibold text-ink">Request History</h3>
        {myRequests.length === 0 ? (
          <p className="text-fs-base text-muted">No department change requests yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {myRequests.map((request) => (
              <div key={request.id} className="rounded-xl border border-border bg-surface-card p-4">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-fs-base font-medium text-ink">
                    {request.currentDepartment} → {request.requestedDepartment}
                  </p>
                  <StatusBadge status={request.status} />
                </div>
                <p className="text-fs-base text-muted">{request.reason}</p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-fs-sm text-muted-light">
                    Requested{" "}
                    {new Date(request.requestedOn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                  {canManage && request.status === "Pending" && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="secondary" onClick={() => updateStatus(request.id, "Approved")}>
                        <Check className="size-3.5" />
                        Approve
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(request.id, "Rejected")}>
                        <X className="size-3.5" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
