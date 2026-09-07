"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, CheckCircle2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Tabs } from "@/components/molecules/Tabs";
import { Table } from "@/components/molecules/Table";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { AddAssetForm, type AddAssetFormValues } from "@/components/organisms/assets/AddAssetForm";
import { RequestAssetForm, type RequestAssetFormValues } from "@/components/organisms/assets/RequestAssetForm";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/use-rbac";
import { getAssets, getAssetRequests, newAssetId, newAssetRequestId } from "@/services/asset.service";
import { getEmployees } from "@/services/employee.service";
import type { AssetItem, AssetRequest, AssetRequestPriority } from "@/types/asset";
import type { Employee } from "@/types/employee";

const TAB_OPTIONS = [
  { label: "Inventory", value: "inventory" },
  { label: "Request Assets", value: "requests" },
];

const PRIORITY_TONE: Record<AssetRequestPriority, "danger" | "warning" | "neutral"> = {
  High: "danger",
  Medium: "warning",
  Low: "neutral",
};

export default function AssetsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { can } = useRBAC();

  const [assets, setAssets] = useState<AssetItem[] | null>(null);
  const [requests, setRequests] = useState<AssetRequest[] | null>(null);
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [tab, setTab] = useState("inventory");
  const [addOpen, setAddOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);

  // Adding to the company *inventory* is a management action, distinct from the
  // personal "add" every self-service role has for submitting an asset request —
  // gate it on "edit" so only roles with real asset-management rights see it.
  const canAddInventory = can("assets", "edit");
  const canManageRequests = can("assets", "toggleStatus") || can("assets", "edit");

  useEffect(() => {
    let isMounted = true;
    Promise.all([getAssets(), getAssetRequests(), getEmployees()]).then(([assetData, requestData, employeeData]) => {
      if (!isMounted) return;
      setAssets(assetData);
      setRequests(requestData);
      setEmployees(employeeData);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const currentEmployee = employees?.find((e) => e.email === user?.email) ?? employees?.[0] ?? null;

  const myAssets = useMemo(
    () => (assets && currentEmployee ? assets.filter((a) => a.assignedTo === currentEmployee.id) : []),
    [assets, currentEmployee]
  );

  const visibleRequests = useMemo(() => {
    if (!requests || !currentEmployee) return [];
    return canManageRequests ? requests : requests.filter((r) => r.employeeId === currentEmployee.id);
  }, [requests, currentEmployee, canManageRequests]);

  function handleAddAsset(values: AddAssetFormValues) {
    if (!currentEmployee) return;
    const newAsset: AssetItem = {
      id: newAssetId(),
      assetName: values.assetName,
      category: values.category,
      assetCode: `A-${Math.floor(1000 + Math.random() * 8999)}`,
      brand: values.brand,
      serialNo: values.serialNo,
      model: values.model || "—",
      isWorking: true,
      company: "Hike Associate",
      assignedTo: currentEmployee.id,
    };
    setAssets((prev) => [newAsset, ...(prev ?? [])]);
    setAddOpen(false);
    showToast(`${newAsset.assetName} added to inventory.`);
  }

  function handleRequestAsset(values: RequestAssetFormValues) {
    if (!currentEmployee) return;
    const newRequest: AssetRequest = {
      id: newAssetRequestId(),
      employeeId: currentEmployee.id,
      employeeName: currentEmployee.name,
      category: values.category,
      reason: values.reason,
      priority: values.priority,
      allocationType: values.allocationType,
      status: "Pending",
      requestedAt: new Date().toISOString().slice(0, 10),
    };
    setRequests((prev) => [newRequest, ...(prev ?? [])]);
    setRequestOpen(false);
    showToast("Asset request submitted.");
  }

  function updateRequestStatus(id: string, status: AssetRequest["status"]) {
    setRequests((prev) => (prev ?? []).map((r) => (r.id === id ? { ...r, status } : r)));
    showToast(status === "Approved" ? "Request approved." : "Request rejected.", status === "Approved" ? "success" : "info");
  }

  return (
    <div>
      <PageHeader
        title="Assets"
        description="Track company assets and assignments."
        actions={
          <>
            {tab === "inventory" && canAddInventory && (
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="size-4" />
                Add Asset
              </Button>
            )}
            {tab === "requests" && (
              <Button onClick={() => setRequestOpen(true)}>
                <Plus className="size-4" />
                Request Asset
              </Button>
            )}
          </>
        }
      />

      <div className="mb-4">
        <Tabs options={TAB_OPTIONS} value={tab} onChange={setTab} />
      </div>

      {!assets || !requests || !currentEmployee ? (
        <div className="flex items-center justify-center gap-2 py-24 text-muted">
          <Spinner />
          Loading assets…
        </div>
      ) : tab === "inventory" ? (
        <Table
          columns={[
            { key: "name", header: "Asset Name", render: (a: AssetItem) => <span className="font-medium text-ink">{a.assetName}</span> },
            { key: "category", header: "Category", render: (a: AssetItem) => a.category },
            { key: "code", header: "Asset Code", render: (a: AssetItem) => a.assetCode },
            { key: "brand", header: "Brand", render: (a: AssetItem) => a.brand },
            { key: "serial", header: "Serial No.", render: (a: AssetItem) => a.serialNo },
            { key: "model", header: "Model", render: (a: AssetItem) => a.model },
            {
              key: "working",
              header: "Working?",
              render: (a: AssetItem) => <Badge tone={a.isWorking ? "success" : "danger"}>{a.isWorking ? "Yes" : "No"}</Badge>,
            },
            { key: "owner", header: "Assigned To", render: (a: AssetItem) => employees?.find((e) => e.id === a.assignedTo)?.name ?? "—" },
          ]}
          data={canManageRequests ? assets : myAssets}
          keyField={(a) => a.id}
          emptyMessage="No assets assigned yet."
        />
      ) : (
        <Table
          columns={[
            { key: "category", header: "Category", render: (r: AssetRequest) => r.category },
            { key: "employee", header: "Employee", render: (r: AssetRequest) => r.employeeName },
            { key: "reason", header: "Reason", render: (r: AssetRequest) => r.reason },
            { key: "priority", header: "Priority", render: (r: AssetRequest) => <Badge tone={PRIORITY_TONE[r.priority]}>{r.priority}</Badge> },
            { key: "allocation", header: "Type", render: (r: AssetRequest) => r.allocationType },
            {
              key: "date",
              header: "Requested At",
              render: (r: AssetRequest) => new Date(r.requestedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
            },
            {
              key: "status",
              header: "Status",
              render: (r: AssetRequest) => (
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={r.status} />
                  {canManageRequests && r.status === "Pending" && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="text-success" onClick={() => updateRequestStatus(r.id, "Approved")} aria-label="Approve">
                        <CheckCircle2 className="size-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-danger" onClick={() => updateRequestStatus(r.id, "Rejected")} aria-label="Reject">
                        <XCircle className="size-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ),
            },
          ]}
          data={visibleRequests}
          keyField={(r) => r.id}
          emptyMessage="No asset requests yet."
        />
      )}

      <AddAssetForm open={addOpen} onClose={() => setAddOpen(false)} onSubmit={handleAddAsset} />
      <RequestAssetForm open={requestOpen} onClose={() => setRequestOpen(false)} onSubmit={handleRequestAsset} />
    </div>
  );
}
