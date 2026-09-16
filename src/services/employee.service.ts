import { httpService } from "@/lib/http/http.service";
import { toAbsoluteAssetUrl } from "@/lib/asset-url";
import { EMPLOYMENT_STATUSES, type Employee, type EmploymentStatus } from "@/types/employee";

/**
 * Employee directory service — wired to the real HRMS backend's
 * Admin > Employees API (see the "HRMS API" Postman collection). The exact
 * shape of each list item isn't documented beyond the filter/sort params it
 * accepts, so mapRawEmployee below checks a few plausible field-name
 * variants defensively; tighten it once you've seen a real response.
 */

export interface EmployeeListParams {
  search?: string;
  department?: string;
  designation?: string;
  status?: EmploymentStatus | "";
  employmentType?: string;
  location?: string;
  onboardingStatus?: "pending" | "in_progress" | "completed" | "all" | "";
  sortBy?: "name_asc" | "name_desc" | "department_asc" | "department_desc" | "";
  page?: number;
  limit?: number;
}

export interface EmployeeListResult {
  employees: Employee[];
  total: number;
}

interface RawEmployee {
  userId?: string;
  id?: string;
  _id?: string;
  employeeId?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
  phone?: string;
  designation?: string;
  department?: string;
  location?: string;
  workLocation?: string;
  employmentType?: string;
  status?: string;
  role?: string;
  skills?: string[];
  joiningDate?: string;
  joinedDate?: string;
  profilePicture?: string;
  avatarUrl?: string;
  reportsTo?: string;
  manager?: string;
  onboardingStatus?: string;
}

function isKnownStatus(value: string | undefined): value is EmploymentStatus {
  return Boolean(value) && (EMPLOYMENT_STATUSES as string[]).includes(value as string);
}

function mapRawEmployee(raw: RawEmployee): Employee {
  const id = raw.userId ?? raw.id ?? raw._id ?? "";
  const name = raw.name ?? [raw.firstName, raw.lastName].filter(Boolean).join(" ").trim();
  const avatar = raw.profilePicture ?? raw.avatarUrl;
  const status = raw.status?.toLowerCase();

  return {
    id,
    employeeId: raw.employeeId,
    name: name || "Unnamed Employee",
    email: raw.email ?? "",
    phone: raw.mobile ?? raw.phone,
    avatarUrl: avatar ? toAbsoluteAssetUrl(avatar) : undefined,
    designation: raw.designation ?? "",
    department: raw.department ?? "",
    location: raw.location ?? raw.workLocation,
    employmentType: raw.employmentType,
    status: isKnownStatus(status) ? status : "active",
    role: raw.role,
    skills: raw.skills ?? [],
    joinedDate: raw.joiningDate ?? raw.joinedDate,
    manager: raw.reportsTo ?? raw.manager,
    onboardingStatus: raw.onboardingStatus,
  };
}

export async function listEmployeesRemote(params: EmployeeListParams = {}): Promise<EmployeeListResult> {
  const query: Record<string, string | number> = {};
  if (params.search) query.search = params.search;
  if (params.department) query.department = params.department;
  if (params.designation) query.designation = params.designation;
  if (params.status) query.status = params.status;
  if (params.employmentType) query.employmentType = params.employmentType;
  if (params.location) query.location = params.location;
  if (params.onboardingStatus) query.onboardingStatus = params.onboardingStatus;
  if (params.sortBy) query.sortBy = params.sortBy;
  query.page = params.page ?? 1;
  query.limit = params.limit ?? 20;

  const data = await httpService.get<
    { employees?: RawEmployee[]; data?: RawEmployee[]; total?: number } | RawEmployee[]
  >("/api/admin/employees", query);

  const rawList = Array.isArray(data) ? data : (data.employees ?? data.data ?? []);
  const total = Array.isArray(data) ? rawList.length : (data.total ?? rawList.length);

  return { employees: rawList.map(mapRawEmployee), total };
}

/** Full directory in one call (fully-onboarded employees only, per the API's
 * default) — used by the card-grid Employee Directory, which filters/sorts
 * client-side rather than round-tripping the server on every keystroke. */
export async function getEmployees(): Promise<Employee[]> {
  const { employees } = await listEmployeesRemote({ limit: 200 });
  return employees;
}

/** Only active/inactive are accepted here — on-leave and terminated are
 * separate workflows per the collection, not part of this toggle. */
export async function updateEmployeeStatus(userId: string, status: "active" | "inactive"): Promise<void> {
  await httpService.patch(`/api/admin/employees/${userId}/status`, { status });
}
