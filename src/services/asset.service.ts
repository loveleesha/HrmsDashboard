import { httpService } from "@/lib/http/http.service";
import { API_ENDPOINTS } from "@/lib/apiEndpoint";
import type { AssetAllocationType, AssetItem, AssetRequest, AssetRequestPriority, AssetRequestStatus, AssetStatus } from "@/types/asset";

/**
 * Company asset inventory + self-service requests — wired to the real HRMS
 * backend's Admin > Assets / User > Assets API (see the "HRMS API" Postman
 * collection). assets.view is self-service for everyone (My Assigned Assets /
 * My Requests); assets.edit/.delete/.toggleStatus gate the admin-wide
 * inventory management surface, deliberately not assets.view.
 */

interface RawAssignee {
  id?: string;
  _id?: string;
  name?: string;
  employeeId?: string;
}

interface RawAsset {
  id?: string;
  _id?: string;
  name?: string;
  category?: string;
  serialNumber?: string;
  status?: string;
  assignedTo?: RawAssignee | string | null;
}

interface RawAssetRequest {
  id?: string;
  _id?: string;
  employee?: RawAssignee | string | null;
  employeeName?: string;
  category?: string;
  reason?: string;
  priority?: string;
  allocationType?: string;
  status?: string;
  rejectionReason?: string;
  createdAt?: string;
  requestedAt?: string;
}

function normalizeStatus(value: string | undefined): AssetStatus {
  const lower = value?.toLowerCase();
  if (lower === "assigned") return "Assigned";
  if (lower === "under maintenance") return "Under Maintenance";
  if (lower === "retired") return "Retired";
  return "Available";
}

function normalizeRequestStatus(value: string | undefined): AssetRequestStatus {
  const lower = value?.toLowerCase();
  if (lower === "approved") return "Approved";
  if (lower === "rejected") return "Rejected";
  return "Pending";
}

function normalizePriority(value: string | undefined): AssetRequestPriority {
  const lower = value?.toLowerCase();
  if (lower === "high") return "High";
  if (lower === "low") return "Low";
  return "Medium";
}

function mapAssignee(raw: RawAssignee | string | null | undefined) {
  if (!raw || typeof raw === "string") return undefined;
  const id = raw.id ?? raw._id;
  if (!id) return undefined;
  return { id, name: raw.name ?? "Unknown", employeeId: raw.employeeId };
}

function mapAsset(raw: RawAsset): AssetItem {
  return {
    id: raw.id ?? raw._id ?? "",
    name: raw.name ?? "",
    category: raw.category ?? "",
    serialNumber: raw.serialNumber,
    status: normalizeStatus(raw.status),
    assignedTo: mapAssignee(raw.assignedTo),
  };
}

function mapAssetRequest(raw: RawAssetRequest): AssetRequest {
  const employee = typeof raw.employee === "object" && raw.employee ? raw.employee : undefined;
  return {
    id: raw.id ?? raw._id ?? "",
    employeeId: employee?.id ?? employee?._id,
    employeeName: raw.employeeName ?? employee?.name ?? "—",
    category: raw.category ?? "",
    reason: raw.reason ?? "",
    priority: normalizePriority(raw.priority),
    allocationType: (raw.allocationType as AssetAllocationType) ?? "New",
    status: normalizeRequestStatus(raw.status),
    rejectionReason: raw.rejectionReason,
    requestedAt: raw.createdAt ?? raw.requestedAt ?? "",
  };
}

// This backend's list endpoints have been seen wrapping under the singular
// resource name (e.g. Admin > Leave's { "leave": [...] }) rather than the
// plural — every unwrap here checks both.
function unwrapAssets(data: { asset?: RawAsset[]; assets?: RawAsset[] } | RawAsset[]): RawAsset[] {
  return Array.isArray(data) ? data : (data.assets ?? data.asset ?? []);
}

function unwrapRequests(
  data: { request?: RawAssetRequest[]; requests?: RawAssetRequest[] } | RawAssetRequest[]
): RawAssetRequest[] {
  return Array.isArray(data) ? data : (data.requests ?? data.request ?? []);
}

/* ---------------------------- User > Assets ---------------------------- */

/** Company assets currently assigned to the caller. */
export async function getMyAssets(): Promise<AssetItem[]> {
  const data = await httpService.get<Parameters<typeof unwrapAssets>[0]>(API_ENDPOINTS.user.assets);
  return unwrapAssets(data).map(mapAsset);
}

export async function getMyAssetRequests(status?: AssetRequestStatus): Promise<AssetRequest[]> {
  const data = await httpService.get<Parameters<typeof unwrapRequests>[0]>(
    API_ENDPOINTS.user.assetRequests,
    status ? { status: status.toLowerCase() } : undefined
  );
  return unwrapRequests(data).map(mapAssetRequest);
}

export async function requestAsset(payload: {
  category: string;
  allocationType: AssetAllocationType;
  priority: AssetRequestPriority;
  reason: string;
}): Promise<void> {
  await httpService.post(API_ENDPOINTS.user.assetRequests, payload);
}

/* --------------------------- Admin > Assets ----------------------------- */

export async function listAssets(filters: { category?: string; status?: AssetStatus } = {}): Promise<AssetItem[]> {
  const query: Record<string, string> = {};
  if (filters.category) query.category = filters.category;
  if (filters.status) query.status = filters.status;
  const data = await httpService.get<Parameters<typeof unwrapAssets>[0]>(API_ENDPOINTS.admin.assets, query);
  return unwrapAssets(data).map(mapAsset);
}

/** Always created with status "Available". */
export async function createAsset(payload: { name: string; category: string; serialNumber?: string }): Promise<AssetItem> {
  const data = await httpService.post<{ asset?: RawAsset } | RawAsset>(API_ENDPOINTS.admin.assets, payload);
  return mapAsset("asset" in data && data.asset ? data.asset : (data as RawAsset));
}

/** name/category/serialNumber only — not status or assignment. */
export async function updateAsset(
  id: string,
  payload: Partial<{ name: string; category: string; serialNumber: string }>
): Promise<AssetItem> {
  const data = await httpService.patch<{ asset?: RawAsset } | RawAsset>(API_ENDPOINTS.admin.assetById(id), payload);
  return mapAsset("asset" in data && data.asset ? data.asset : (data as RawAsset));
}

/** The Postman collection's own note says employeeId here is the Employee
 * document's own _id, not userId — but the admin/employees list this app's
 * picker is built from never actually exposes that _id, only userId, so
 * that's what gets sent (see AssignAssetModal). 409 if the asset isn't
 * currently "Available". */
export async function assignAsset(assetId: string, userId: string): Promise<void> {
  await httpService.post(API_ENDPOINTS.admin.assetAssign(assetId), { employeeId: userId });
}

/** Returns the asset to "Available". */
export async function unassignAsset(assetId: string): Promise<void> {
  await httpService.post(API_ENDPOINTS.admin.assetUnassign(assetId));
}

/** "Assigned" is deliberately excluded — only ever set via assign/unassign
 * above. Refused while the asset is currently assigned. */
export async function updateAssetStatus(id: string, status: "Available" | "Under Maintenance" | "Retired"): Promise<void> {
  await httpService.patch(API_ENDPOINTS.admin.assetStatus(id), { status });
}

/** 400 ASSET_IN_USE while currently assigned — unassign first. */
export async function deleteAsset(id: string): Promise<void> {
  await httpService.delete(API_ENDPOINTS.admin.assetById(id));
}

export async function listAssetRequests(
  filters: { status?: AssetRequestStatus; employeeId?: string } = {}
): Promise<AssetRequest[]> {
  const query: Record<string, string> = {};
  if (filters.status) query.status = filters.status.toLowerCase();
  if (filters.employeeId) query.employeeId = filters.employeeId;
  const data = await httpService.get<Parameters<typeof unwrapRequests>[0]>(API_ENDPOINTS.admin.assetRequests, query);
  return unwrapRequests(data).map(mapAssetRequest);
}

/** Doesn't auto-assign a specific item — Assign Asset to Employee fulfills it separately. */
export async function approveAssetRequest(id: string): Promise<void> {
  await httpService.patch(API_ENDPOINTS.admin.assetRequestStatus(id), { status: "approved" });
}

export async function rejectAssetRequest(id: string, rejectionReason: string): Promise<void> {
  await httpService.patch(API_ENDPOINTS.admin.assetRequestStatus(id), { status: "rejected", rejectionReason });
}
