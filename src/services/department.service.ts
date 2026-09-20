import { httpService } from "@/lib/http/http.service";
import { API_ENDPOINTS } from "@/lib/apiEndpoint";
import type { ApiDepartment, CreateDepartmentPayload, DepartmentStatus, UpdateDepartmentPayload } from "@/types/department";

/**
 * Departments service — wired to the real HRMS backend's Admin > Departments
 * API (see the "HRMS API" Postman collection). A simple CRUD master list
 * (departments.* permissions); deleting a department still in use by an
 * employee is refused by the backend with 409 CANNOT_DELETE_DEPARTMENT_IN_USE.
 */

interface ApiDepartmentRaw {
  id?: string;
  _id?: string;
  name: string;
  description?: string;
  head?: string;
  status?: string;
}

function mapDepartment(raw: ApiDepartmentRaw): ApiDepartment {
  return {
    id: raw.id ?? raw._id ?? raw.name,
    name: raw.name,
    description: raw.description,
    head: raw.head,
    status: raw.status === "inactive" ? "inactive" : "active",
  };
}

export async function listDepartments(status?: DepartmentStatus): Promise<ApiDepartment[]> {
  const data = await httpService.get<{ departments?: ApiDepartmentRaw[] } | ApiDepartmentRaw[]>(
    API_ENDPOINTS.admin.departments,
    status ? { status } : undefined
  );
  const departments = Array.isArray(data) ? data : (data.departments ?? []);
  return departments.map(mapDepartment);
}

export async function createDepartment(payload: CreateDepartmentPayload): Promise<ApiDepartment> {
  const data = await httpService.post<{ department?: ApiDepartmentRaw } | ApiDepartmentRaw>(
    API_ENDPOINTS.admin.departments,
    payload
  );
  const department = "department" in data && data.department ? data.department : (data as ApiDepartmentRaw);
  return mapDepartment(department);
}

export async function updateDepartment(id: string, payload: UpdateDepartmentPayload): Promise<ApiDepartment> {
  const data = await httpService.patch<{ department?: ApiDepartmentRaw } | ApiDepartmentRaw>(
    API_ENDPOINTS.admin.departmentById(id),
    payload
  );
  const department = "department" in data && data.department ? data.department : (data as ApiDepartmentRaw);
  return mapDepartment(department);
}

export async function deleteDepartment(id: string): Promise<void> {
  await httpService.delete<{ message?: string }>(API_ENDPOINTS.admin.departmentById(id));
}
