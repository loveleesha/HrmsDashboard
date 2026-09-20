import { httpService } from "@/lib/http/http.service";
import type { DsrEntry, SubmitDsrPayload } from "@/types/dsr";

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
  const data = await httpService.get<Parameters<typeof unwrap>[0]>("/api/user/dsr", month ? { month } : undefined);
  return unwrap(data).map(mapDsr).sort(byDateDesc);
}

export async function listAllDsr(params: { employeeId?: string; month?: string } = {}): Promise<DsrEntry[]> {
  const query = Object.fromEntries(Object.entries(params).filter(([, v]) => Boolean(v)));
  const data = await httpService.get<Parameters<typeof unwrap>[0]>("/api/admin/dsr", query);
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
  await httpService.post("/api/user/dsr", payload);
}

/** "2:5" → "02:05" — the backend takes HH:MM. */
export function normalizeHours(value: string): string {
  const [h, m] = value.split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}
