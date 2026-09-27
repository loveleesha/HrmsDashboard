import axios, { AxiosError, type AxiosInstance } from "axios";
import { useAuthStore } from "@/store/auth.store";
import { AUTH_ROUTES, clearSessionCookie } from "@/lib/session";
import { isAdminTierRole } from "@/types/user";

/**
 * Shared Axios instance for every service wired to the real HRMS backend
 * (see the "HRMS API" Postman collection). Auth is Bearer-token based: the
 * request interceptor reads the current session token straight out of the
 * zustand auth store (src/store/auth.store.ts) — that store is the single
 * source of truth, so there's nothing to keep manually in sync — and stamps
 * it onto every request. Callers never pass a token or set the Authorization
 * header themselves.
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://backend-neon-phi-91.vercel.app";

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  if (config.data instanceof FormData) {
    // The axios instance's default headers already stamped Content-Type:
    // application/json before this interceptor runs — for a FormData body
    // that header must be removed entirely (not just left alone) so the
    // browser can generate its own `multipart/form-data; boundary=...`
    // header. Leaving application/json in place silently strips the
    // boundary and the server receives an unparseable body (every file
    // field arrives empty, e.g. `{}`, even though the file was attached).
    config.headers.delete("Content-Type");
  } else {
    config.headers.set("Content-Type", "application/json");
  }
  return config;
});

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response) {
      const { status, data } = error.response;

      // Session token is gone/expired — clear it and bounce to login, same
      // as the route proxy would do on the next navigation, except this
      // fires immediately instead of waiting for a full page load.
      if (status === 401 && typeof window !== "undefined") {
        const loginRoute = isAdminTierRole(useAuthStore.getState().user?.role) ? "/admin/login" : "/login";

        useAuthStore.getState().clearSession();
        clearSessionCookie();

        const currentPath = window.location.pathname + window.location.search;
        const isAuthRoute = AUTH_ROUTES.some((route) => currentPath.startsWith(route));
        if (!isAuthRoute) {
          // A hard navigation, not router.push() — this file runs outside
          // any component (it's an Axios interceptor), so there's no
          // useRouter() to call; a full reload also guarantees every bit of
          // in-memory React state tied to the dead session gets torn down.
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.href = `${loginRoute}?callbackUrl=${encodeURIComponent(currentPath)}`;
        }
      }

      return Promise.reject(new ApiError(data?.message ?? "Something went wrong. Please try again.", status));
    }

    if (error.request) {
      return Promise.reject(new ApiError("Network error: unable to reach the server.", 0));
    }

    return Promise.reject(new ApiError(error.message, 0));
  }
);
