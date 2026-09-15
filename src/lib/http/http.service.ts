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
  async get<T>(url: string, params?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.get<T>(url, { ...config, params });
    return response.data;
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
