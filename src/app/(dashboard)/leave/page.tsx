"use client";

import { useCallback, useEffect, useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/use-rbac";
import {
  applyForLeave,
  approveLeave,
  getMyLeaveBalance,
  getMyLeaveRequests,
  getUpcomingTeamLeave,
  listTeamLeave,
  rejectLeave,
} from "@/services/leave.service";
import type { LeaveBalance, LeaveRequest } from "@/types/leave";

const TODAY = new Date();

export default function LeavePage() {
  const { showToast } = useToast();
  const { can } = useRBAC();

  const canApprove = can("leave", "approve");
  const canApply = can("leave", "add");

  const [balances, setBalances] = useState<LeaveBalance[] | null>(null);
  const [myRequests, setMyRequests] = useState<LeaveRequest[] | null>(null);
  const [teamRequests, setTeamRequests] = useState<LeaveRequest[] | null>(null);
  const [tab, setTab] = useState("mine");
  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(() => {
    Promise.all([getMyLeaveBalance(), getMyLeaveRequests()]).then(([balanceData, requestData]) => {
      setBalances(balanceData);
      setMyRequests(requestData);
    });
    if (canApprove) {
      listTeamLeave().then(setTeamRequests);
    }
  }, [canApprove]);

  useEffect(() => {
    load();
  }, [load]);

  const pendingApprovals = (teamRequests ?? []).filter((r) => r.status === "Pending");
  const upcomingTeamLeave = canApprove ? getUpcomingTeamLeave(teamRequests ?? [], new Date(TODAY)) : [];

  async function handleApply(values: LeaveRequestFormValues) {
    setIsSubmitting(true);
    try {
      await applyForLeave({ type: values.leaveType, startDate: values.startDate, endDate: values.endDate, reason: values.reason });
      showToast("Leave request submitted for approval.");
      setFormOpen(false);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not submit this leave request.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      await approveLeave(id);
      showToast("Leave request approved.");
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not approve this request.", "error");
    }
  }

  async function handleReject(id: string, comment: string) {
    try {
      await rejectLeave(id, comment);
      showToast("Leave request rejected.", "info");
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not reject this request.", "error");
    }
  }

  const tabOptions = [
    { label: "My Leave", value: "mine" },
    ...(canApprove ? [{ label: `Team Approvals${pendingApprovals.length ? ` (${pendingApprovals.length})` : ""}`, value: "approvals" }] : []),
  ];
  const activeTab = tabOptions.some((option) => option.value === tab) ? tab : tabOptions[0].value;

  const isLoading = balances === null || myRequests === null || (canApprove && teamRequests === null);

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

      {isLoading ? (
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

          {activeTab === "mine" && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[7fr_3fr]">
              <div className="flex flex-col gap-4">
                <LeaveBalanceCards balances={balances ?? []} />
                <div>
                  <h3 className="mb-3 text-fs-xl font-semibold text-ink">My Requests</h3>
                  <MyLeaveRequestsList requests={myRequests ?? []} />
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <LeaveTypeChart balances={balances ?? []} />
                {canApprove && <UpcomingTeamLeave requests={upcomingTeamLeave} />}
              </div>
            </div>
          )}

          {activeTab === "approvals" && canApprove && (
            <LeaveApprovalsList
              requests={pendingApprovals}
              canApprove={canApprove}
              canReject={canApprove}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          )}

          <LeaveRequestForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleApply} isSubmitting={isSubmitting} />
        </>
      )}
    </div>
  );
}
