"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { Tabs } from "@/components/molecules/Tabs";
import { LeaveBalanceCards } from "@/components/organisms/leave/LeaveBalanceCards";
import { LeaveTypeChart } from "@/components/organisms/leave/LeaveTypeChart";
import { UpcomingTeamLeave } from "@/components/organisms/leave/UpcomingTeamLeave";
import { MyLeaveRequestsList } from "@/components/organisms/leave/MyLeaveRequestsList";
import { LeaveApprovalsList } from "@/components/organisms/leave/LeaveApprovalsList";
import { LeaveRequestForm, type LeaveRequestFormValues } from "@/components/organisms/leave/LeaveRequestForm";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/use-rbac";
import { getEmployees } from "@/services/employee.service";
import {
  getLeaveRequests,
  getLeaveBalances,
  getUpcomingTeamLeave,
  newLeaveRequestId,
} from "@/services/leave.service";
import type { LeaveRequest } from "@/types/leave";
import type { Employee } from "@/types/employee";

const TODAY = new Date();

export default function LeavePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { can } = useRBAC();

  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [requests, setRequests] = useState<LeaveRequest[] | null>(null);
  const [tab, setTab] = useState("mine");
  const [formOpen, setFormOpen] = useState(false);

  const canApprove = can("leave", "approve");
  const canReject = can("leave", "reject");
  const canApply = can("leave", "add");

  useEffect(() => {
    let isMounted = true;
    Promise.all([getEmployees(), getLeaveRequests()]).then(([employeeData, requestData]) => {
      if (!isMounted) return;
      setEmployees(employeeData);
      setRequests(requestData);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const currentEmployee = employees?.find((employee) => employee.email === user?.email) ?? employees?.[0] ?? null;

  const myRequests = useMemo(
    () => (requests && currentEmployee ? requests.filter((r) => r.employeeId === currentEmployee.id) : []),
    [requests, currentEmployee]
  );

  const balances = useMemo(
    () => (currentEmployee && requests ? getLeaveBalances(currentEmployee.id, requests) : []),
    [currentEmployee, requests]
  );

  const upcomingTeamLeave = useMemo(
    () => (requests ? getUpcomingTeamLeave(requests, new Date(TODAY)) : []),
    [requests]
  );

  const pendingApprovals = useMemo(
    () =>
      requests && currentEmployee
        ? requests.filter((r) => r.status === "Pending" && r.employeeId !== currentEmployee.id)
        : [],
    [requests, currentEmployee]
  );

  function handleApply(values: LeaveRequestFormValues) {
    if (!currentEmployee) return;
    const newRequest: LeaveRequest = {
      id: newLeaveRequestId(),
      employeeId: currentEmployee.id,
      employeeName: currentEmployee.name,
      designation: currentEmployee.designation,
      department: currentEmployee.department,
      leaveType: values.leaveType,
      startDate: values.startDate,
      endDate: values.endDate,
      days: values.days,
      reason: values.reason,
      status: "Pending",
      appliedOn: TODAY.toISOString().slice(0, 10),
    };
    setRequests((prev) => [newRequest, ...(prev ?? [])]);
    setFormOpen(false);
    showToast("Leave request submitted for approval.");
  }

  function handleCancel(id: string) {
    setRequests((prev) => (prev ?? []).map((r) => (r.id === id ? { ...r, status: "Cancelled" } : r)));
    showToast("Leave request cancelled.", "info");
  }

  function handleApprove(id: string) {
    const request = requests?.find((r) => r.id === id);
    setRequests((prev) =>
      (prev ?? []).map((r) =>
        r.id === id
          ? { ...r, status: "Approved", approverName: user?.name, approvedOn: TODAY.toISOString().slice(0, 10) }
          : r
      )
    );
    showToast(`Approved ${request?.employeeName ?? "employee"}'s leave request.`);
  }

  function handleReject(id: string, comment: string) {
    const request = requests?.find((r) => r.id === id);
    setRequests((prev) =>
      (prev ?? []).map((r) =>
        r.id === id
          ? {
              ...r,
              status: "Rejected",
              approverName: user?.name,
              approvedOn: TODAY.toISOString().slice(0, 10),
              comment,
            }
          : r
      )
    );
    showToast(`Rejected ${request?.employeeName ?? "employee"}'s leave request.`, "info");
  }

  const tabOptions = [
    { label: "My Leave", value: "mine" },
    ...((canApprove || canReject)
      ? [{ label: `Team Approvals${pendingApprovals.length ? ` (${pendingApprovals.length})` : ""}`, value: "approvals" }]
      : []),
  ];
  const activeTab = tabOptions.some((option) => option.value === tab) ? tab : tabOptions[0].value;

  return (
    <div>
      <PageHeader
        title="Leave"
        description="Apply for leave and manage team approvals."
        actions={
          canApply ? (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="size-4" />
              Apply Leave
            </Button>
          ) : undefined
        }
      />

      {!employees || !requests ? (
        <div className="flex items-center justify-center gap-2 py-24 text-muted">
          <Spinner />
          Loading leave data…
        </div>
      ) : (
        <>
          {tabOptions.length > 1 && (
            <div className="mb-4">
              <Tabs options={tabOptions} value={activeTab} onChange={setTab} />
            </div>
          )}

          {tab === "mine" && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[7fr_3fr]">
              <div className="flex flex-col gap-4">
                <LeaveBalanceCards balances={balances} />
                <div>
                  <h3 className="mb-3 text-fs-xl font-semibold text-ink">My Requests</h3>
                  <MyLeaveRequestsList requests={myRequests} onCancel={handleCancel} />
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <LeaveTypeChart balances={balances} />
                <UpcomingTeamLeave requests={upcomingTeamLeave} />
              </div>
            </div>
          )}

          {tab === "approvals" && (canApprove || canReject) && (
            <LeaveApprovalsList
              requests={pendingApprovals}
              canApprove={canApprove}
              canReject={canReject}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          )}

          <LeaveRequestForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleApply} />
        </>
      )}
    </div>
  );
}
