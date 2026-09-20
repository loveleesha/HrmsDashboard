"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, CheckCircle2, XCircle, UserPlus, UserMinus, Pencil, Trash2, Wrench, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Tabs } from "@/components/molecules/Tabs";
import { Table } from "@/components/molecules/Table";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { ActionMenu } from "@/components/molecules/ActionMenu";
import { ConfirmModal } from "@/components/molecules/ConfirmModal";
import { ReasonModal } from "@/components/molecules/ReasonModal";
import { AddAssetForm, type AddAssetFormValues } from "@/components/organisms/assets/AddAssetForm";
import { RequestAssetForm, type RequestAssetFormValues } from "@/components/organisms/assets/RequestAssetForm";
import { AssignAssetModal } from "@/components/organisms/assets/AssignAssetModal";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/use-rbac";
import {
  approveAssetRequest,
  assignAsset,
  createAsset,
  deleteAsset,
  getMyAssetRequests,
  getMyAssets,
  listAssetRequests,
  listAssets,
  rejectAssetRequest,
  requestAsset,
  unassignAsset,
  updateAsset,
  updateAssetStatus,
} from "@/services/asset.service";
import { getEmployees } from "@/services/employee.service";
import type { AssetItem, AssetRequest, AssetRequestPriority } from "@/types/asset";
import type { Employee } from "@/types/employee";

const PRIORITY_TONE: Record<AssetRequestPriority, "danger" | "warning" | "neutral"> = {
  High: "danger",
  Medium: "warning",
  Low: "neutral",
};

export default function AssetsPage() {
  const { showToast } = useToast();
  const { can } = useRBAC();

  // Managing the company inventory (Admin > Assets) is deliberately not
  // gated on assets.view — every role has that by default for the
  // self-service "my assets/requests" surface instead.
  const canManage = can("assets", "edit") || can("assets", "toggleStatus");
  const canDelete = can("assets", "delete");

  const [tab, setTab] = useState(canManage ? "inventory" : "my-assets");
  const [assets, setAssets] = useState<AssetItem[] | null>(null);
  const [requests, setRequests] = useState<AssetRequest[] | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [addOpen, setAddOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AssetItem | null>(null);
  const [assignTarget, setAssignTarget] = useState<AssetItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AssetItem | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AssetRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(() => {
    if (canManage) {
      Promise.all([listAssets(), listAssetRequests(), getEmployees()]).then(([a, r, e]) => {
        setAssets(a);
        setRequests(r);
        setEmployees(e);
      });
    } else {
      Promise.all([getMyAssets(), getMyAssetRequests()]).then(([a, r]) => {
        setAssets(a);
        setRequests(r);
      });
    }
  }, [canManage]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddAsset(values: AddAssetFormValues) {
    setIsSubmitting(true);
    try {
      await createAsset(values);
      showToast(`${values.name} added to inventory.`);
      setAddOpen(false);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not add this asset.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEditAsset(values: AddAssetFormValues) {
    if (!editTarget) return;
    setIsSubmitting(true);
    try {
      await updateAsset(editTarget.id, values);
      showToast("Asset updated.");
      setEditTarget(null);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update this asset.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRequestAsset(values: RequestAssetFormValues) {
    setIsSubmitting(true);
    try {
      await requestAsset(values);
      showToast("Asset request submitted.");
      setRequestOpen(false);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not submit this request.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAssign(userId: string) {
    if (!assignTarget) return;
    setIsSubmitting(true);
    try {
      await assignAsset(assignTarget.id, userId);
      showToast(`${assignTarget.name} assigned.`);
      setAssignTarget(null);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not assign this asset.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUnassign(asset: AssetItem) {
    try {
      await unassignAsset(asset.id);
      showToast(`${asset.name} unassigned.`);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not unassign this asset.", "error");
    }
  }

  async function handleStatusChange(asset: AssetItem, status: "Available" | "Under Maintenance" | "Retired") {
    try {
      await updateAssetStatus(asset.id, status);
      showToast(`${asset.name} marked ${status.toLowerCase()}.`);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update this asset's status.", "error");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await deleteAsset(deleteTarget.id);
      showToast(`${deleteTarget.name} deleted.`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not delete this asset.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleApproveRequest(request: AssetRequest) {
    try {
      await approveAssetRequest(request.id);
      showToast("Request approved.");
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not approve this request.", "error");
    }
  }

  async function handleRejectRequest(reason: string) {
    if (!rejectTarget) return;
    setIsSubmitting(true);
    try {
      await rejectAssetRequest(rejectTarget.id, reason);
      showToast("Request rejected.", "info");
      setRejectTarget(null);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not reject this request.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  const tabOptions = canManage
    ? [
        { label: "Inventory", value: "inventory" },
        { label: "Requests", value: "requests" },
      ]
    : [
        { label: "My Assets", value: "my-assets" },
        { label: "My Requests", value: "my-requests" },
      ];

  const isLoading = assets === null || requests === null;
  const showingInventory = tab === "inventory" || tab === "my-assets";

  return (
    <div>
      <PageHeader
        title="Assets"
        description="Track company assets and assignments."
        actions={
          <>
            {showingInventory && canManage && (
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="size-4" />
                Add Asset
              </Button>
            )}
            {!showingInventory && !canManage && (
              <Button onClick={() => setRequestOpen(true)}>
                <Plus className="size-4" />
                Request Asset
              </Button>
            )}
            {showingInventory && !canManage && (
              <Button onClick={() => setRequestOpen(true)}>
                <Plus className="size-4" />
                Request Asset
              </Button>
            )}
          </>
        }
      />

      <div className="mb-4">
        <Tabs options={tabOptions} value={tab} onChange={setTab} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-24 text-muted">
          <Spinner />
          Loading assets…
        </div>
      ) : showingInventory ? (
        <Table
          columns={[
            { key: "name", header: "Asset Name", render: (a: AssetItem) => <span className="font-medium text-ink">{a.name}</span> },
            { key: "category", header: "Category", render: (a: AssetItem) => a.category },
            { key: "serial", header: "Serial No.", render: (a: AssetItem) => a.serialNumber ?? "—" },
            { key: "status", header: "Status", render: (a: AssetItem) => <StatusBadge status={a.status} /> },
            { key: "owner", header: "Assigned To", render: (a: AssetItem) => a.assignedTo?.name ?? "—" },
            ...(canManage
              ? [
                  {
                    key: "actions",
                    header: "",
                    render: (a: AssetItem) => (
                      <ActionMenu
                        items={[
                          { label: "Edit Asset", icon: Pencil, onClick: () => setEditTarget(a) },
                          {
                            label: "Assign to Employee",
                            icon: UserPlus,
                            onClick: () => setAssignTarget(a),
                            hidden: a.status !== "Available",
                          },
                          {
                            label: "Unassign",
                            icon: UserMinus,
                            onClick: () => handleUnassign(a),
                            hidden: a.status !== "Assigned",
                          },
                          {
                            label: "Mark Under Maintenance",
                            icon: Wrench,
                            onClick: () => handleStatusChange(a, "Under Maintenance"),
                            hidden: a.status === "Assigned" || a.status === "Under Maintenance",
                          },
                          {
                            label: "Mark Available",
                            icon: RotateCcw,
                            onClick: () => handleStatusChange(a, "Available"),
                            hidden: a.status === "Assigned" || a.status === "Available",
                          },
                          {
                            label: "Retire",
                            icon: XCircle,
                            onClick: () => handleStatusChange(a, "Retired"),
                            hidden: a.status === "Assigned" || a.status === "Retired",
                            tone: "danger" as const,
                          },
                          {
                            label: "Delete",
                            icon: Trash2,
                            onClick: () => setDeleteTarget(a),
                            hidden: !canDelete || a.status === "Assigned",
                            tone: "danger" as const,
                          },
                        ]}
                      />
                    ),
                  },
                ]
              : []),
          ]}
          data={assets ?? []}
          keyField={(a) => a.id}
          emptyMessage={canManage ? "No assets in inventory yet." : "No assets assigned to you yet."}
        />
      ) : (
        <Table
          columns={[
            { key: "category", header: "Category", render: (r: AssetRequest) => r.category },
            ...(canManage ? [{ key: "employee", header: "Employee", render: (r: AssetRequest) => r.employeeName }] : []),
            { key: "reason", header: "Reason", render: (r: AssetRequest) => r.reason },
            { key: "priority", header: "Priority", render: (r: AssetRequest) => <Badge tone={PRIORITY_TONE[r.priority]}>{r.priority}</Badge> },
            { key: "allocation", header: "Type", render: (r: AssetRequest) => r.allocationType },
            {
              key: "date",
              header: "Requested At",
              render: (r: AssetRequest) =>
                r.requestedAt ? new Date(r.requestedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—",
            },
            {
              key: "status",
              header: "Status",
              render: (r: AssetRequest) => (
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={r.status} />
                  {canManage && r.status === "Pending" && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="text-success" onClick={() => handleApproveRequest(r)} aria-label="Approve">
                        <CheckCircle2 className="size-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-danger" onClick={() => setRejectTarget(r)} aria-label="Reject">
                        <XCircle className="size-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ),
            },
          ]}
          data={requests ?? []}
          keyField={(r) => r.id}
          emptyMessage="No asset requests yet."
        />
      )}

      <AddAssetForm open={addOpen} onClose={() => setAddOpen(false)} onSubmit={handleAddAsset} isSubmitting={isSubmitting} />
      <AddAssetForm
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEditAsset}
        isSubmitting={isSubmitting}
        initialValues={editTarget ? { name: editTarget.name, category: editTarget.category, serialNumber: editTarget.serialNumber } : undefined}
      />
      <RequestAssetForm open={requestOpen} onClose={() => setRequestOpen(false)} onSubmit={handleRequestAsset} isSubmitting={isSubmitting} />
      <AssignAssetModal
        open={Boolean(assignTarget)}
        onClose={() => setAssignTarget(null)}
        asset={assignTarget}
        employees={employees}
        onSubmit={handleAssign}
        isSubmitting={isSubmitting}
      />
      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete this asset?"
        description={deleteTarget?.name}
        body="This can't be undone."
        confirmLabel="Delete"
        isConfirming={isSubmitting}
      />
      <ReasonModal
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        onSubmit={handleRejectRequest}
        title="Reject asset request"
        description={rejectTarget ? `${rejectTarget.employeeName} · ${rejectTarget.category}` : undefined}
        label="Rejection reason"
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
