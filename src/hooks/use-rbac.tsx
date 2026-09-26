"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Role } from "@/types/user";
import type { ActionKey, ModuleKey, RolePermissionMap } from "@/types/rbac";
import { can as canCheck } from "@/lib/rbac/permissions";
import { resolveRolePermissions } from "@/lib/rbac/role-label";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";
import { getMyProfile } from "@/services/profile.service";

interface RBACContextValue {
  /** The signed-in user's role — access is always gated on the real
   * account, there is no simulated "view as" override. */
  viewAsRole: Role;
  can: (moduleKey: ModuleKey, action?: ActionKey) => boolean;
  /** True for accounts with no real Employee record behind them
   * (super_admin/hr_admin/manager/...) — see GET /api/user/profile's
   * `profileType`. Self-service-only surfaces (My Projects, My Documents,
   * Appraisal, ...) don't apply to these accounts; use this instead of
   * re-deriving it from `viewAsRole` on every page that needs it. */
  isAdminAccount: boolean;
}

const RBACContext = createContext<RBACContextValue | undefined>(undefined);

/**
 * Some roles (confirmed via a real backend response for "manager") never
 * define a distinct `employeeOnboarding` entry at all — only `employees` —
 * even though the onboarding flow (Add Employee, verify documents, activate)
 * is gated on `employeeOnboarding` throughout the app. Without this, a role
 * with `employees.add: true` but no `employeeOnboarding` key at all would
 * silently lose access to onboarding entirely, since a missing module
 * resolves every action to false.
 *
 * When `employeeOnboarding` is present (even as `{}`), it's authoritative —
 * a role can deliberately configure the two differently (see the static
 * admin-tier defaults in permissions.ts). Only a fully absent key falls back
 * to treating `employees` as covering onboarding too.
 */
function withOnboardingFallback(permissions: RolePermissionMap): RolePermissionMap {
  if (permissions.employeeOnboarding !== undefined) return permissions;
  return { ...permissions, employeeOnboarding: permissions.employees };
}

export function RBACProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const { roles } = useRoles();
  const [ownPermissions, setOwnPermissions] = useState<RolePermissionMap | undefined>(undefined);
  const [isAdminAccount, setIsAdminAccount] = useState(false);

  const viewAsRole = user?.role ?? "employee";

  // GET /api/user/profile returns this exact account's own resolved
  // permissions for admin-tier roles (super_admin/hr_admin/manager/...) —
  // guaranteed in sync with Settings -> Role & Access with no name-matching
  // involved. Fetched once per session; the httpService GET de-dupe means
  // this shares a single request with the Profile page if that's also
  // loading around the same time.
  useEffect(() => {
    if (!token || !user) return;
    let isMounted = true;
    getMyProfile()
      .then((profile) => {
        if (!isMounted) return;
        setOwnPermissions(profile.permissions);
        setIsAdminAccount(profile.profileType === "admin");
      })
      .catch(() => {
        // No employee profile on this account, or the request failed —
        // fall back to the roles-list lookup below, same as an
        // employee-shape profile (which never carries `permissions`).
        if (isMounted) setOwnPermissions(undefined);
      });
    return () => {
      isMounted = false;
    };
  }, [token, user]);

  // The account's own permissions, when available, are the exact source of
  // truth for THIS account. The roles-list-by-name lookup remains the
  // fallback: employee-shape profiles never carry `permissions` at all, and
  // it also covers the brief window before the fetch above resolves.
  const permissions = useMemo(
    () => withOnboardingFallback(ownPermissions ?? resolveRolePermissions(roles, viewAsRole)),
    [ownPermissions, roles, viewAsRole]
  );

  const can = useCallback(
    (moduleKey: ModuleKey, action: ActionKey = "view") => canCheck(permissions, moduleKey, action),
    [permissions]
  );

  const value = useMemo<RBACContextValue>(
    () => ({ viewAsRole, can, isAdminAccount }),
    [viewAsRole, can, isAdminAccount]
  );

  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>;
}

export function useRBAC() {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error("useRBAC must be used within an RBACProvider");
  }
  return context;
}
