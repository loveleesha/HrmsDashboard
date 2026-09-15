"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import * as roleService from "@/services/role.service";
import { resolveRoleLabel, resolveRolePermissions } from "@/lib/rbac/role-label";
import type { RolePermissionMap } from "@/types/rbac";
import type { ApiRole, CreateRolePayload, UpdateRolePayload } from "@/types/role";

interface RolesContextValue {
  roles: ApiRole[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createRole: (payload: CreateRolePayload) => Promise<ApiRole>;
  updateRole: (roleId: string, payload: UpdateRolePayload) => Promise<ApiRole>;
  deleteRole: (roleId: string) => Promise<void>;
  /** Display label for a role name — the live roles list first, this app's
   * static fallback labels second, a prettified name as a last resort. */
  getRoleLabel: (roleName: string) => string;
  /** Permission set for a role name, same preference order as getRoleLabel. */
  getRolePermissions: (roleName: string) => RolePermissionMap;
}

const RolesContext = createContext<RolesContextValue | undefined>(undefined);

export function RolesProvider({ children }: { children: ReactNode }) {
  // Only used as a "do we have a session yet" gate — the shared Axios
  // instance (src/lib/http/interceptor.ts) reads the token itself.
  const { token } = useAuth();
  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await roleService.listRoles();
      setRoles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load roles.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const createRole = useCallback(async (payload: CreateRolePayload) => {
    const role = await roleService.createRole(payload);
    setRoles((prev) => [...prev, role]);
    return role;
  }, []);

  const updateRole = useCallback(async (roleId: string, payload: UpdateRolePayload) => {
    const role = await roleService.updateRole(roleId, payload);
    setRoles((prev) => prev.map((r) => (r.id === roleId ? role : r)));
    return role;
  }, []);

  const deleteRole = useCallback(async (roleId: string) => {
    await roleService.deleteRole(roleId);
    setRoles((prev) => prev.filter((r) => r.id !== roleId));
  }, []);

  const getRoleLabel = useCallback((roleName: string) => resolveRoleLabel(roles, roleName), [roles]);
  const getRolePermissions = useCallback((roleName: string) => resolveRolePermissions(roles, roleName), [roles]);

  const value: RolesContextValue = {
    roles,
    isLoading,
    error,
    refresh,
    createRole,
    updateRole,
    deleteRole,
    getRoleLabel,
    getRolePermissions,
  };

  return <RolesContext.Provider value={value}>{children}</RolesContext.Provider>;
}

export function useRoles() {
  const context = useContext(RolesContext);
  if (!context) {
    throw new Error("useRoles must be used within a RolesProvider");
  }
  return context;
}
