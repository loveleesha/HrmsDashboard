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

/** The inverse of toAbsoluteAssetUrl — the backend stores relative "/uploads/..."
 * paths, so an already-absolute URL pointing at our own API host is turned
 * back into that path before being sent (otherwise resaving an existing file
 * would store a host-qualified URL). Other URLs are passed through untouched. */
export function toRelativeAssetPath(pathOrUrl: string | undefined): string {
  if (!pathOrUrl) return "";
  return pathOrUrl.startsWith(API_BASE_URL) ? pathOrUrl.slice(API_BASE_URL.length) : pathOrUrl;
}
