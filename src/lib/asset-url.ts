import { API_BASE_URL } from "@/lib/http/interceptor";

/** Uploaded files come back from the backend as relative paths (e.g.
 * "/uploads/profile-pictures/...jpg") — resolve against the API host to get
 * something a browser can actually load. */
export function toAbsoluteAssetUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${API_BASE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export function fileNameFromPath(pathOrUrl: string): string {
  return pathOrUrl.split("/").pop() || pathOrUrl;
}
