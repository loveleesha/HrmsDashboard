import type { AssetItem, AssetRequest } from "@/types/asset";

/**
 * Mock asset inventory service. Replace the bodies of these functions with
 * real API calls once the Node.js backend exists.
 */

export const MOCK_ASSETS: AssetItem[] = [];

export const MOCK_ASSET_REQUESTS: AssetRequest[] = [];

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
