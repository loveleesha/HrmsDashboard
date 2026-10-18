import { httpService } from "@/lib/http/http.service";
import { API_ENDPOINTS } from "@/lib/apiEndpoint";
import type { DsrCustomFieldAnswer, DsrEntry, DsrFieldType, DsrFormField, SubmitDsrPayload } from "@/types/dsr";

/**
 * Daily status reports — wired to the real HRMS backend (see the "HRMS API"
 * Postman collection). Two surfaces: User > DSR (own entries, dsr.add/view —
 * every role) and Admin > DSR (everyone's, gated on dsr.approve rather than
 * dsr.view so a regular employee's default view can't read others' reports).
 * Entry bodies aren't documented beyond `dsr`, so mapping is defensive.
 */

interface RawRef {
  id?: string;
  _id?: string;
  name?: string;
  employeeId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

interface RawCustomFieldAnswer {
  fieldId?: string;
  label?: string;
  type?: DsrFieldType;
  value?: string | number | null;
}

interface RawDsr {
  id?: string;
  _id?: string;
  date?: string;
  project?: RawRef | string | null;
  otherProject?: string | null;
  estimatedHours?: string;
  noWorkDone?: boolean;
  aiToolsUsed?: boolean;
  description?: string;
  customFields?: RawCustomFieldAnswer[];
  employee?: RawRef | string | null;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

function refName(ref: RawRef | string | null | undefined): string | undefined {
  if (!ref || typeof ref === "string") return undefined;
  return ref.name ?? ([ref.firstName, ref.lastName].filter(Boolean).join(" ").trim() || undefined);
}

function mapDsr(raw: RawDsr): DsrEntry {
  const projectName = refName(raw.project);
  const employee = typeof raw.employee === "object" && raw.employee ? raw.employee : undefined;
  return {
    id: raw.id ?? raw._id ?? `${raw.date}-${raw.otherProject ?? projectName}`,
    date: raw.date ?? "",
    project: projectName ?? raw.otherProject ?? "Internal Project",
    isOtherProject: !projectName,
    estimatedHours: raw.estimatedHours ?? "",
    noWorkDone: Boolean(raw.noWorkDone),
    aiToolsUsed: Boolean(raw.aiToolsUsed),
    description: raw.description ?? "",
    customFields: (raw.customFields ?? []).map(
      (f): DsrCustomFieldAnswer => ({
        fieldId: f.fieldId,
        label: f.label ?? "",
        type: f.type ?? "text",
        value: f.value ?? null,
      })
    ),
    employeeName: refName(raw.employee),
    employeeCode: employee?.employeeId,
    employeeEmail: employee?.email,
    status: raw.status,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function unwrap(data: { dsr?: RawDsr[]; dsrs?: RawDsr[]; entries?: RawDsr[] } | RawDsr[]): RawDsr[] {
  return Array.isArray(data) ? data : (data.dsr ?? data.dsrs ?? data.entries ?? []);
}

function byDateDesc(a: DsrEntry, b: DsrEntry) {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

export async function listMyDsr(month?: string): Promise<DsrEntry[]> {
  const data = await httpService.get<Parameters<typeof unwrap>[0]>(API_ENDPOINTS.user.dsr, month ? { month } : undefined);
  return unwrap(data).map(mapDsr).sort(byDateDesc);
}

export async function listAllDsr(params: { employeeId?: string; month?: string } = {}): Promise<DsrEntry[]> {
  const query = Object.fromEntries(Object.entries(params).filter(([, v]) => Boolean(v)));
  const data = await httpService.get<Parameters<typeof unwrap>[0]>(API_ENDPOINTS.admin.dsr, query);
  return unwrap(data).map(mapDsr).sort(byDateDesc);
}

/**
 * There's no "get one DSR" endpoint in the collection — the detail page finds
 * the entry in the same list the DSR page shows: the caller's own entries
 * first, then (for roles with dsr.approve, when asked for the admin scope)
 * everyone's.
 */
export async function getDsrEntry(id: string, scope: "user" | "admin"): Promise<DsrEntry | undefined> {
  const entries = scope === "admin" ? await listAllDsr() : await listMyDsr();
  return entries.find((entry) => entry.id === id);
}

export async function submitDsr(payload: SubmitDsrPayload): Promise<void> {
  await httpService.post(API_ENDPOINTS.user.dsr, payload);
}

/** "2:5" → "02:05" — the backend takes HH:MM. */
export function normalizeHours(value: string): string {
  const [h, m] = value.split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}

/* ------------------------------------------------------------------------ *
 * DSR Form Builder — the admin-configured extra fields every submission's
 * form renders below the fixed project/date/hours/description inputs. Read
 * is self-service (every role needs it to render their own form); write is
 * admin-only (dsr.edit) — see routes/Admin/dsrFieldRoutes.js /
 * routes/User/projectRoutes.js's GET /dsr-fields.
 * ------------------------------------------------------------------------ */

interface RawDsrFormField {
  id?: string;
  _id?: string;
  label?: string;
  type?: DsrFieldType;
  required?: boolean;
  defaultValue?: string | null;
  options?: string[];
  applicableRoles?: string[];
  isActive?: boolean;
  order?: number;
}

function mapDsrFormField(raw: RawDsrFormField): DsrFormField {
  return {
    id: raw.id ?? raw._id ?? "",
    label: raw.label ?? "",
    type: raw.type ?? "text",
    required: Boolean(raw.required),
    defaultValue: raw.defaultValue ?? null,
    options: raw.options ?? [],
    applicableRoles: raw.applicableRoles ?? [],
    isActive: raw.isActive !== false,
    order: raw.order ?? 0,
  };
}

function unwrapFields(data: { fields?: RawDsrFormField[] } | RawDsrFormField[]): RawDsrFormField[] {
  return Array.isArray(data) ? data : (data.fields ?? []);
}

/** Every role can read the current form — see the self-service GET above.
 * Used by DsrFormBuilder.tsx (admin management): when the caller has
 * dsr.edit, the backend hands back every field across every role so the
 * builder can list/edit all of them — not scoped to the caller's own role.
 * A self-service submission panel must NOT use this one; see
 * getMyDsrFormFields below. */
export async function getDsrFormFields(): Promise<DsrFormField[]> {
  const data = await httpService.get<Parameters<typeof unwrapFields>[0]>(API_ENDPOINTS.user.dsrFields);
  return unwrapFields(data).map(mapDsrFormField).sort((a, b) => a.order - b.order);
}

/** Same endpoint as getDsrFormFields, forced to only the caller's own role's
 * active fields regardless of whether they also hold dsr.edit — a role that
 * both manages the DSR form and submits its own DSR (e.g. "manager") would
 * otherwise get the full cross-role list from getDsrFormFields when
 * populating its own submission panel. Used by CreateDsrPanel.tsx only. */
export async function getMyDsrFormFields(): Promise<DsrFormField[]> {
  const data = await httpService.get<Parameters<typeof unwrapFields>[0]>(API_ENDPOINTS.user.myDsrFields);
  return unwrapFields(data).map(mapDsrFormField).sort((a, b) => a.order - b.order);
}

export async function addDsrFormField(params: {
  label: string;
  type: DsrFieldType;
  required: boolean;
  defaultValue?: string | null;
  options?: string[];
  applicableRoles: string[];
}): Promise<DsrFormField> {
  const data = await httpService.post<{ field: RawDsrFormField }>(API_ENDPOINTS.admin.dsrFields, params);
  return mapDsrFormField(data.field);
}

export async function updateDsrFormField(
  id: string,
  params: Partial<{
    label: string;
    type: DsrFieldType;
    required: boolean;
    defaultValue: string | null;
    options: string[];
    applicableRoles: string[];
    isActive: boolean;
  }>
): Promise<DsrFormField> {
  const data = await httpService.patch<{ field: RawDsrFormField }>(API_ENDPOINTS.admin.dsrFieldById(id), params);
  return mapDsrFormField(data.field);
}

export async function deleteDsrFormField(id: string): Promise<void> {
  await httpService.delete(API_ENDPOINTS.admin.dsrFieldById(id));
}

/* ------------------------------------------------------------------------ *
 * Export — Admin > DSR > All Worksheets' "Export CSV", gated on dsr.export
 * (separate from dsr.approve, which only gates viewing the list). fromDate/
 * toDate are both required and the backend caps their span at 31 days.
 * ------------------------------------------------------------------------ */

/** Triggers a browser download of every DSR within the given range (and,
 * optionally, one project) as CSV. */
export async function exportDsr(params: { fromDate: string; toDate: string; project?: string }): Promise<void> {
  const csv = await httpService.get<string>(API_ENDPOINTS.admin.dsrExport, params, { responseType: "text" });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `dsr-${params.fromDate}-to-${params.toDate}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
