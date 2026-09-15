"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import type { Role } from "@/types/user";
import type { ActionKey, ModuleKey, RolePermissionMap } from "@/types/rbac";
import { DEFAULT_ROLE_PERMISSIONS, can as canCheck } from "@/lib/rbac/permissions";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";

interface RBACContextValue {
  /** The signed-in user's role — access is always gated on the real
   * account, there is no simulated "view as" override. */
  viewAsRole: Role;
  can: (moduleKey: ModuleKey, action?: ActionKey) => boolean;
}

const RBACContext = createContext<RBACContextValue | undefined>(undefined);

export function RBACProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { roles } = useRoles();

  const viewAsRole = user?.role ?? "employee";

  const permissions = useMemo<RolePermissionMap>(() => {
    // Prefer the live, backend-managed role (Settings -> Role & Access) so
    // admin edits take effect immediately; fall back to the static matrix
    // when the roles API hasn't returned this role yet (not loaded, the
    // signed-in role lacks roleAccess.view, or the backend simply has no
    // entry for it) — otherwise every user would lose all access on any
    // hiccup fetching /api/admin/roles.
    const remoteRole = roles.find((role) => role.name === viewAsRole);
    if (remoteRole && Object.keys(remoteRole.permissions).length > 0) {
      return remoteRole.permissions;
    }
    return DEFAULT_ROLE_PERMISSIONS[viewAsRole] ?? {};
  }, [roles, viewAsRole]);

  const can = useCallback(
    (moduleKey: ModuleKey, action: ActionKey = "view") => canCheck(permissions, moduleKey, action),
    [permissions]
  );

  const value = useMemo<RBACContextValue>(() => ({ viewAsRole, can }), [viewAsRole, can]);

  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>;
}

export function useRBAC() {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error("useRBAC must be used within an RBACProvider");
  }
  return context;
}
