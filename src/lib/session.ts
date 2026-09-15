/**
 * Session cookie helpers, shared by the auth service, the HTTP interceptor
 * (src/lib/http/interceptor.ts), and the route-gating proxy (src/proxy.ts).
 * Split out on its own so the interceptor can react to a 401 (clear the
 * cookie, bounce to /login) without importing auth.service.ts and creating a
 * cycle back through the http client auth.service itself depends on.
 */

export const SESSION_COOKIE = "hrms_session";

/** Unauthenticated pages — shared by proxy.ts (server-side route gating) and
 * the HTTP interceptor (client-side redirect-to-login on a 401), so the two
 * never drift out of sync. */
export const AUTH_ROUTES = ["/login", "/admin/login", "/forgot-password", "/otp", "/reset-password"];

const JWT_SHAPE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

/**
 * Cheap structural check (3 base64url segments), not a signature
 * verification — this only decides whether the session cookie is worth
 * trusting for route-gating in proxy.ts. Every real API call still sends
 * the token as-is and the backend is the one that actually verifies it.
 */
export function isJwtShaped(value: string): boolean {
  return JWT_SHAPE.test(value);
}

export function setSessionCookie(token: string) {
  const maxAgeSeconds = 60 * 60 * 24 * 7;
  // Not httpOnly — this cookie only exists so the server-side proxy (see
  // src/proxy.ts) can gate routes; the actual bearer token used for API
  // calls lives in the zustand auth store (src/store/auth.store.ts).
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
}

export function clearSessionCookie() {
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
}
