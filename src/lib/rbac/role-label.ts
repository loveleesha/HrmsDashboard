import type { ApiRole } from "@/types/role";
import { ROLE_LABELS, type Role } from "@/types/user";
import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/rbac/permissions";
import type { RolePermissionMap } from "@/types/rbac";

/** "team_lead" -> "Team Lead" — last-resort label for a role with no entry
 * in either the live roles list or this app's static fallback labels. */
function prettifyRoleName(name: string): string {
  return name
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Resolves a role's display label. Roles are managed live via Settings ->
 * Role & Access (see role.service.ts) — that list is the source of truth;
 * the static ROLE_LABELS map only covers this app's built-in roles and
 * exists purely as a fallback for while the roles API hasn't loaded yet,
 * not as something to keep in sync by hand.
 */
export function resolveRoleLabel(roles: ApiRole[], roleName: string): string {
  const remote = roles.find((role) => role.name === roleName);
  if (remote) return remote.label;
  if (roleName in ROLE_LABELS) return ROLE_LABELS[roleName as Role];
  return prettifyRoleName(roleName);
}

/**
 * A saved role only knows the modules that existed when it was last saved —
 * modules added to the app afterwards (Projects, Departments, Support
 * Tickets (Admin), ...) are simply absent from its permission map. Revoking
 * access always writes an explicit `false`, so an absent module means "never
 * configured", and for a built-in role it takes that role's default grant.
 * Modules the role does define are never overridden.
 */
export function withDefaultPermissions(roleName: string, permissions: RolePermissionMap): RolePermissionMap {
  const defaults = DEFAULT_ROLE_PERMISSIONS[roleName as Role];
  if (!defaults) return permissions;
  const merged: RolePermissionMap = { ...permissions };
  for (const moduleKey of Object.keys(defaults) as (keyof RolePermissionMap)[]) {
    if (!(moduleKey in merged)) merged[moduleKey] = defaults[moduleKey];
  }
  return merged;
}

/**
 * Resolves a role's permission set with the same preference order as
 * resolveRoleLabel above — live data first, the static default matrix only
 * as a fallback (an unseeded/unreachable roles API shouldn't zero out
 * everyone's access).
 */
export function resolveRolePermissions(roles: ApiRole[], roleName: string): RolePermissionMap {
  const remote = roles.find((role) => role.name === roleName);
  if (remote && Object.keys(remote.permissions).length > 0) return withDefaultPermissions(roleName, remote.permissions);
  return DEFAULT_ROLE_PERMISSIONS[roleName as Role] ?? {};
}
