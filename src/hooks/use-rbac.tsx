"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ROLES, type Role } from "@/types/user";
import type { ActionKey, ModuleKey, RolePermissionMap } from "@/types/rbac";
import { DEFAULT_ROLE_PERMISSIONS, can as canCheck } from "@/lib/rbac/permissions";
import { useAuth } from "@/hooks/use-auth";

const VIEW_AS_STORAGE_KEY = "hrms-view-as-role";
const MATRIX_STORAGE_KEY = "hrms-permission-matrix";

type PermissionMatrix = Record<Role, RolePermissionMap>;

interface RBACContextValue {
  /** The role currently being simulated in the UI. */
  viewAsRole: Role;
  setViewAsRole: (role: Role) => void;
  /** The signed-in user's real role, independent of the simulation. */
  actualRole: Role | null;
  isSimulating: boolean;
  /** The live (possibly edited) permission matrix, keyed by role. */
  permissionMatrix: PermissionMatrix;
  can: (moduleKey: ModuleKey, action?: ActionKey) => boolean;
  canForRole: (role: Role, moduleKey: ModuleKey, action?: ActionKey) => boolean;
  updatePermission: (role: Role, moduleKey: ModuleKey, action: ActionKey, value: boolean) => void;
  setAllPermissionsForModule: (role: Role, moduleKey: ModuleKey, actions: ActionKey[], value: boolean) => void;
  resetPermissions: () => void;
}

const RBACContext = createContext<RBACContextValue | undefined>(undefined);

function readStoredMatrix(): PermissionMatrix | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(MATRIX_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PermissionMatrix;
  } catch {
    return null;
  }
}

export function RBACProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [viewAsRole, setViewAsRoleState] = useState<Role>("employee");
  const [permissionMatrix, setPermissionMatrix] = useState<PermissionMatrix>(DEFAULT_ROLE_PERMISSIONS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // One-time hydration of client-only localStorage state; not derivable during SSR.
    const storedRole = localStorage.getItem(VIEW_AS_STORAGE_KEY) as Role | null;
    if (storedRole && ROLES.includes(storedRole)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setViewAsRoleState(storedRole);
    }
    const storedMatrix = readStoredMatrix();
    if (storedMatrix) {
      setPermissionMatrix(storedMatrix);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated && user) {
      // Default the simulated role to whoever actually logged in, the first time.
      const storedRole = localStorage.getItem(VIEW_AS_STORAGE_KEY);
      if (!storedRole) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setViewAsRoleState(user.role);
      }
    }
  }, [hydrated, user]);

  const setViewAsRole = useCallback((role: Role) => {
    setViewAsRoleState(role);
    localStorage.setItem(VIEW_AS_STORAGE_KEY, role);
  }, []);

  const updatePermission = useCallback(
    (role: Role, moduleKey: ModuleKey, action: ActionKey, value: boolean) => {
      setPermissionMatrix((prev) => {
        const next: PermissionMatrix = {
          ...prev,
          [role]: {
            ...prev[role],
            [moduleKey]: {
              ...prev[role]?.[moduleKey],
              [action]: value,
            },
          },
        };
        localStorage.setItem(MATRIX_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const setAllPermissionsForModule = useCallback(
    (role: Role, moduleKey: ModuleKey, actions: ActionKey[], value: boolean) => {
      setPermissionMatrix((prev) => {
        const nextModule = { ...prev[role]?.[moduleKey] };
        actions.forEach((action) => {
          nextModule[action] = value;
        });
        const next: PermissionMatrix = {
          ...prev,
          [role]: {
            ...prev[role],
            [moduleKey]: nextModule,
          },
        };
        localStorage.setItem(MATRIX_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const resetPermissions = useCallback(() => {
    setPermissionMatrix(DEFAULT_ROLE_PERMISSIONS);
    localStorage.removeItem(MATRIX_STORAGE_KEY);
  }, []);

  const can = useCallback(
    (moduleKey: ModuleKey, action: ActionKey = "view") =>
      canCheck(permissionMatrix[viewAsRole], moduleKey, action),
    [permissionMatrix, viewAsRole]
  );

  const canForRole = useCallback(
    (role: Role, moduleKey: ModuleKey, action: ActionKey = "view") =>
      canCheck(permissionMatrix[role], moduleKey, action),
    [permissionMatrix]
  );

  const value = useMemo<RBACContextValue>(
    () => ({
      viewAsRole,
      setViewAsRole,
      actualRole: user?.role ?? null,
      isSimulating: Boolean(user && user.role !== viewAsRole),
      permissionMatrix,
      can,
      canForRole,
      updatePermission,
      setAllPermissionsForModule,
      resetPermissions,
    }),
    [viewAsRole, setViewAsRole, user, permissionMatrix, can, canForRole, updatePermission, setAllPermissionsForModule, resetPermissions]
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
