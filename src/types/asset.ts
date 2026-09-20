export type AssetStatus = "Available" | "Assigned" | "Under Maintenance" | "Retired";
export type AssetRequestStatus = "Pending" | "Approved" | "Rejected";
export type AssetRequestPriority = "Low" | "Medium" | "High";
export type AssetAllocationType = "New" | "Replacement";

export interface AssetAssignee {
  id: string;
  name: string;
  employeeId?: string;
}

/**
 * Mirrors the real HRMS backend's Asset document (Admin > Assets, see the
 * "HRMS API" Postman collection) — Create/Update Asset only ever accept
 * name/category/serialNumber; status is never set directly except through
 * Assign/Unassign ("Assigned"/"Available") or Update Asset Status
 * ("Available"/"Under Maintenance"/"Retired").
 */
export interface AssetItem {
  id: string;
  name: string;
  category: string;
  serialNumber?: string;
  status: AssetStatus;
  assignedTo?: AssetAssignee;
}

export interface AssetRequest {
  id: string;
  employeeId?: string;
  employeeName: string;
  category: string;
  reason: string;
  priority: AssetRequestPriority;
  allocationType: AssetAllocationType;
  status: AssetRequestStatus;
  rejectionReason?: string;
  requestedAt: string;
}

export const ASSET_CATEGORIES = ["Laptop", "Monitor", "Mobile", "Headset", "Accessory", "Furniture"] as const;
