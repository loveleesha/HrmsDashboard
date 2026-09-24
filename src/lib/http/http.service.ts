import type { AxiosRequestConfig } from "axios";
import { axiosInstance } from "@/lib/http/interceptor";

/**
 * Thin REST wrapper around the shared Axios instance. Every method returns
 * `response.data` directly and lets the interceptor's rejected ApiError
 * (see interceptor.ts) propagate as-is, so callers just do:
 *
 *   try { await httpService.post(...) } catch (err) { err.message }
 */
class HttpService {
  // Concurrent GETs to the same url+params share one in-flight request instead
  // of hitting the server twice. Covers React StrictMode's intentional
  // double-effect in dev, plus any page whose fetch fires once before auth
  // finishes rehydrating and again right after (same value, same params) —
  // rather than patching each page's effect individually, callers only ever
  // trigger one real network request no matter how many times get() is
  // called for the same thing while it's still pending. Only applied to GET:
  // POST/PUT/PATCH/DELETE are mutations and must never be silently merged.
  private inFlightGets = new Map<string, Promise<unknown>>();

  async get<T>(url: string, params?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<T> {
    const key = `${url}?${JSON.stringify(params ?? {})}`;
    const existing = this.inFlightGets.get(key);
    if (existing) return existing as Promise<T>;

    const request = axiosInstance
      .get<T>(url, { ...config, params })
      .then((response) => response.data)
      .finally(() => {
        this.inFlightGets.delete(key);
      });

    this.inFlightGets.set(key, request);
    return request;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.delete<T>(url, config);
    return response.data;
  }
}

export const httpService = new HttpService();
