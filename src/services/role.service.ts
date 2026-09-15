import { httpService } from "@/lib/http/http.service";
import type { ApiRole, CreateRolePayload, UpdateRolePayload } from "@/types/role";

/**
 * Role & Access service — wired to the real HRMS backend's Admin > Roles API
 * (see the "HRMS API" Postman collection, controllers/Admin/roleController.js).
 * All five endpoints require an admin-tier bearer token whose role has the
 * matching roleAccess permission (view for reads, add/edit/delete for writes)
 * — the shared Axios instance attaches the current session's token
 * automatically (see src/lib/http/interceptor.ts), so callers don't pass one.
 */

interface ApiRoleRaw {
  id?: string;
  _id?: string;
  name: string;
  label: string;
  permissions?: ApiRole["permissions"];
  isSystem?: boolean;
}

function mapRole(raw: ApiRoleRaw): ApiRole {
  return {
    id: raw.id ?? raw._id ?? raw.name,
    name: raw.name,
    label: raw.label ?? raw.name,
    permissions: raw.permissions ?? {},
    isSystem: raw.isSystem,
  };
}

export async function listRoles(): Promise<ApiRole[]> {
  const data = await httpService.get<{ roles?: ApiRoleRaw[] } | ApiRoleRaw[]>("/api/admin/roles");
  const roles = Array.isArray(data) ? data : (data.roles ?? []);
  return roles.map(mapRole);
}

export async function getRole(roleId: string): Promise<ApiRole> {
  const data = await httpService.get<{ role?: ApiRoleRaw } | ApiRoleRaw>(`/api/admin/roles/${roleId}`);
  const role = "role" in data && data.role ? data.role : (data as ApiRoleRaw);
  return mapRole(role);
}

export async function createRole(payload: CreateRolePayload): Promise<ApiRole> {
  const data = await httpService.post<{ role?: ApiRoleRaw } | ApiRoleRaw>("/api/admin/roles", payload);
  const role = "role" in data && data.role ? data.role : (data as ApiRoleRaw);
  return mapRole(role);
}

export async function updateRole(roleId: string, payload: UpdateRolePayload): Promise<ApiRole> {
  const data = await httpService.patch<{ role?: ApiRoleRaw } | ApiRoleRaw>(`/api/admin/roles/${roleId}`, payload);
  const role = "role" in data && data.role ? data.role : (data as ApiRoleRaw);
  return mapRole(role);
}

export async function deleteRole(roleId: string): Promise<void> {
  await httpService.delete<{ message?: string }>(`/api/admin/roles/${roleId}`);
}
