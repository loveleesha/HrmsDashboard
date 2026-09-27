import { httpService } from "@/lib/http/http.service";
import { API_ENDPOINTS } from "@/lib/apiEndpoint";

/** Reports service — wired to the real backend (routes/Admin/reportRoutes.js),
 * which computes each report's summary live from the underlying collections. */

export interface ReportDef {
  id: string;
  name: string;
  module: string;
  description: string;
  lastGenerated: string;
  summary: Record<string, unknown>;
}

export async function getReports(): Promise<ReportDef[]> {
  const data = await httpService.get<{ reports: ReportDef[] }>(API_ENDPOINTS.admin.reports);
  return data.reports;
}

/** Triggers a browser download of the report's underlying data as CSV. */
export async function exportReport(id: string, name: string): Promise<void> {
  const csv = await httpService.get<string>(API_ENDPOINTS.admin.reportExport(id), undefined, {
    responseType: "text",
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name.replace(/\s+/g, "-").toLowerCase()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
