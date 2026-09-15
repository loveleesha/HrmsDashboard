import type { RolePermissionMap } from "@/types/rbac";

/**
 * A role as stored by the real backend (Admin > Roles in the "HRMS API"
 * Postman collection) — distinct from the fixed `Role` union in
 * src/types/user.ts, which only covers the RBAC simulation's built-in roles.
 * The backend lets admins define arbitrary roles (`name` + `label` +
 * `permissions`), so this module manages its own dynamic list.
 */
export interface ApiRole {
  id: string;
  name: string;
  label: string;
  permissions: RolePermissionMap;
  isSystem?: boolean;
}

export interface CreateRolePayload {
  name: string;
  label: string;
  permissions: RolePermissionMap;
}

export interface UpdateRolePayload {
  label?: string;
  permissions?: RolePermissionMap;
}
