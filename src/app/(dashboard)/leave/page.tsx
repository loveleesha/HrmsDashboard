"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { Tabs } from "@/components/molecules/Tabs";
import { ConfirmModal } from "@/components/molecules/ConfirmModal";
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
  deleteMyLeaveRequest,
  deleteTeamLeaveRequest,
  getMyLeaveBalance,
  getMyLeaveRequests,
  getUpcomingTeamLeave,
  listTeamLeave,
  rejectLeave,
  updateMyLeaveRequest,
  updateTeamLeaveRequest,
} from "@/services/leave.service";
import type { LeaveBalance, LeaveRequest } from "@/types/leave";

const TODAY = new Date();

/** Only fields the form/edit endpoints care about — the rest of LeaveRequest
 * (status, employee info, approver, ...) isn't editable. */
function toFormValues(request: LeaveRequest): LeaveRequestFormValues {
  return {
    leaveType: request.leaveType,
    startDate: request.startDate,
    endDate: request.endDate,
    days: request.days,
    reason: request.reason,
  };
}

export default function LeavePage() {
  const { showToast } = useToast();
  const { can, isAdminAccount } = useRBAC();

  const canApprove = can("leave", "approve");
  // Applying for leave needs an Employee record (there's no "my own" leave
  // balance without one) - admin-tier accounts don't have one.
  const canApply = can("leave", "add") && !isAdminAccount;
  // Self-editing/withdrawing your own request shares the same bar as
  // applying (see backend controllers/User/leaveController.js) - it's not
  // the admin-wide leave.edit/leave.delete below.
  const canEditMine = canApply;
  const canDeleteMine = canApply;
  // Admin-wide correction/removal of any employee's request, regardless of
  // status - distinct from approve/reject.
  const canEditTeam = can("leave", "edit");
  const canDeleteTeam = can("leave", "delete");

  const [balances, setBalances] = useState<LeaveBalance[] | null>(null);
  const [myRequests, setMyRequests] = useState<LeaveRequest[] | null>(null);
  const [teamRequests, setTeamRequests] = useState<LeaveRequest[] | null>(null);
  const [tab, setTab] = useState("mine");
  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editTarget, setEditTarget] = useState<{ request: LeaveRequest; scope: "mine" | "team" } | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ request: LeaveRequest; scope: "mine" | "team" } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(() => {
    // GET /api/user/leave(/balance) 404s (PROFILE_NOT_FOUND) for admin-tier
    // accounts - there's no Employee record behind them to have a balance
    // or requests at all, so skip fetching "my own" data entirely for them
    // rather than let that rejection leave the page stuck loading forever.
    if (!isAdminAccount) {
      Promise.all([getMyLeaveBalance(), getMyLeaveRequests()]).then(([balanceData, requestData]) => {
        setBalances(balanceData);
        setMyRequests(requestData);
      });
    }
    if (canApprove) {
      listTeamLeave().then(setTeamRequests);
    }
  }, [canApprove, isAdminAccount]);

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

  async function handleEditSubmit(values: LeaveRequestFormValues) {
    if (!editTarget) return;
    setIsEditSubmitting(true);
    try {
      const payload = { type: values.leaveType, startDate: values.startDate, endDate: values.endDate, reason: values.reason };
      if (editTarget.scope === "mine") {
        await updateMyLeaveRequest(editTarget.request.id, payload);
      } else {
        await updateTeamLeaveRequest(editTarget.request.id, payload);
      }
      showToast("Leave request updated.");
      setEditTarget(null);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update this leave request.", "error");
    } finally {
      setIsEditSubmitting(false);
    }
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.scope === "mine") {
        await deleteMyLeaveRequest(deleteTarget.request.id);
      } else {
        await deleteTeamLeaveRequest(deleteTarget.request.id);
      }
      showToast(deleteTarget.scope === "mine" ? "Leave request withdrawn." : "Leave request deleted.");
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not delete this leave request.", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  const tabOptions = [
    ...(isAdminAccount ? [] : [{ label: "My Leave", value: "mine" }]),
    ...(canApprove ? [{ label: `Team Approvals${pendingApprovals.length ? ` (${pendingApprovals.length})` : ""}`, value: "approvals" }] : []),
  ];
  const activeTab = tabOptions.some((option) => option.value === tab) ? tab : tabOptions[0]?.value;

  const isLoading =
    (!isAdminAccount && (balances === null || myRequests === null)) || (canApprove && teamRequests === null);

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
                  <MyLeaveRequestsList
                    requests={myRequests ?? []}
                    canEdit={canEditMine}
                    canDelete={canDeleteMine}
                    onEdit={(request) => setEditTarget({ request, scope: "mine" })}
                    onDelete={(request) => setDeleteTarget({ request, scope: "mine" })}
                  />
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
              canEdit={canEditTeam}
              canDelete={canDeleteTeam}
              onEdit={(request) => setEditTarget({ request, scope: "team" })}
              onDelete={(request) => setDeleteTarget({ request, scope: "team" })}
            />
          )}

          <LeaveRequestForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleApply} isSubmitting={isSubmitting} />

          <LeaveRequestForm
            open={Boolean(editTarget)}
            onClose={() => setEditTarget(null)}
            onSubmit={handleEditSubmit}
            isSubmitting={isEditSubmitting}
            initialValues={editTarget ? toFormValues(editTarget.request) : undefined}
          />

          <ConfirmModal
            open={Boolean(deleteTarget)}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDeleteConfirmed}
            title={deleteTarget?.scope === "mine" ? "Withdraw Leave Request" : "Delete Leave Request"}
            description={deleteTarget ? `${deleteTarget.request.leaveType} · ${deleteTarget.request.days} day${deleteTarget.request.days === 1 ? "" : "s"}` : undefined}
            body="This can't be undone."
            confirmLabel={deleteTarget?.scope === "mine" ? "Withdraw" : "Delete"}
            isConfirming={isDeleting}
          />
        </>
      )}
    </div>
  );
}
