export type AssetRequestStatus = "Pending" | "Approved" | "Rejected";
export type AssetRequestPriority = "Low" | "Medium" | "High";

export interface AssetItem {
  id: string;
  assetName: string;
  category: string;
  assetCode: string;
  brand: string;
  serialNo: string;
  model: string;
  isWorking: boolean;
  company: string;
  assignedTo: string;
}

export interface AssetRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  category: string;
  reason: string;
  priority: AssetRequestPriority;
  allocationType: "New" | "Replacement";
  status: AssetRequestStatus;
  requestedAt: string;
}

export const ASSET_CATEGORIES = ["Laptop", "Monitor", "Mobile", "Headset", "Accessory", "Furniture"] as const;
