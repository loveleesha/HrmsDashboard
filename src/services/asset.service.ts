import type { AssetItem, AssetRequest } from "@/types/asset";
import { getEmployeeById } from "@/services/employee.service";

/**
 * Mock asset inventory service. Replace the bodies of these functions with
 * real API calls once the Node.js backend exists.
 */

function name(employeeId: string) {
  return getEmployeeById(employeeId)?.name ?? "Unknown";
}

export const MOCK_ASSETS: AssetItem[] = [
  { id: "AST-01", assetName: "HP G10", category: "Laptop", assetCode: "L 3336", brand: "Dell", serialNo: "5CD5156HXW", model: "G10", isWorking: true, company: "Hike Associate", assignedTo: "EMP-1101" },
  { id: "AST-02", assetName: 'Dell 24" Monitor', category: "Monitor", assetCode: "M 1082", brand: "Dell", serialNo: "CN-0T5678", model: "P2422H", isWorking: true, company: "Hike Associate", assignedTo: "EMP-1101" },
  { id: "AST-03", assetName: "MacBook Pro 14", category: "Laptop", assetCode: "L 3401", brand: "Apple", serialNo: "C02FX1234", model: "M3 Pro", isWorking: true, company: "Hike Associate", assignedTo: "EMP-1015" },
  { id: "AST-04", assetName: "Logitech Headset", category: "Headset", assetCode: "H 2210", brand: "Logitech", serialNo: "LGH-90210", model: "H390", isWorking: true, company: "Hike Associate", assignedTo: "EMP-1204" },
  { id: "AST-05", assetName: "ThinkPad X1", category: "Laptop", assetCode: "L 3355", brand: "Lenovo", serialNo: "PF3KX9L2", model: "X1 Carbon", isWorking: false, company: "Hike Associate", assignedTo: "EMP-1120" },
  { id: "AST-06", assetName: "iPhone 14", category: "Mobile", assetCode: "P 0587", brand: "Apple", serialNo: "F2LX9812QP", model: "iPhone 14", isWorking: true, company: "Hike Associate", assignedTo: "EMP-1410" },
  { id: "AST-07", assetName: "Ergonomic Chair", category: "Furniture", assetCode: "F 0912", brand: "Featherlite", serialNo: "FL-8823", model: "Aero", isWorking: true, company: "Hike Associate", assignedTo: "EMP-1256" },
];

export const MOCK_ASSET_REQUESTS: AssetRequest[] = [
  {
    id: "AR-01",
    employeeId: "EMP-1204",
    employeeName: name("EMP-1204"),
    category: "Monitor",
    reason: "Need a second monitor to improve testing productivity.",
    priority: "Medium",
    allocationType: "New",
    status: "Pending",
    requestedAt: "2026-09-03",
  },
  {
    id: "AR-02",
    employeeId: "EMP-1120",
    employeeName: name("EMP-1120"),
    category: "Laptop",
    reason: "Current laptop keeps overheating and shutting down.",
    priority: "High",
    allocationType: "Replacement",
    status: "Approved",
    requestedAt: "2026-08-20",
  },
];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getAssets(): Promise<AssetItem[]> {
  await delay(200);
  return MOCK_ASSETS;
}

export async function getAssetRequests(): Promise<AssetRequest[]> {
  await delay(200);
  return [...MOCK_ASSET_REQUESTS].sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
}

export function newAssetId(): string {
  return `AST-${Math.floor(10 + Math.random() * 89)}`;
}

export function newAssetRequestId(): string {
  return `AR-${Math.floor(10 + Math.random() * 89)}`;
}
