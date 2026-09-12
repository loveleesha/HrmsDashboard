"use client";

import { forwardRef, useImperativeHandle, useMemo } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { FormField } from "@/components/molecules/FormField";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { Badge } from "@/components/atoms/Badge";
import { useAuth } from "@/hooks/use-auth";
import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/rbac/permissions";
import { MODULE_DEFS } from "@/lib/rbac/modules";
import { ACTION_KEYS, ACTION_LABELS, type ActionKey } from "@/types/rbac";
import { ROLE_LABELS, type Role } from "@/types/user";
import { ELEVATED_ONBOARDING_ROLES, ONBOARDING_ROLES, type RoleAccessInfo } from "@/types/onboarding";
import type { OnboardingStepHandle } from "@/components/organisms/onboarding/step-types";
import { cn } from "@/lib/cn";

export interface RoleAccessStepProps {
  value: RoleAccessInfo;
  onChange: (value: RoleAccessInfo) => void;
}

export const RoleAccessStep = forwardRef<OnboardingStepHandle, RoleAccessStepProps>(function RoleAccessStep(
  { value, onChange },
  ref
) {
  const { user } = useAuth();
  const canAssignElevatedRoles = user?.role === "super_admin" || user?.role === "hr_admin";

  useImperativeHandle(ref, () => ({
    validate: () => Boolean(value.role),
  }));

  const assignableRoles = useMemo(
    () => ONBOARDING_ROLES.filter((role) => canAssignElevatedRoles || !ELEVATED_ONBOARDING_ROLES.includes(role)),
    [canAssignElevatedRoles]
  );

  const rolePermissions = DEFAULT_ROLE_PERMISSIONS[value.role] ?? {};
  const accessibleModules = MODULE_DEFS.filter((mod) => Object.values(rolePermissions[mod.key] ?? {}).some(Boolean));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-fs-3xl font-semibold text-ink">Role & Access</h2>
        <p className="mt-1 text-fs-base text-muted">
          The default role for a new hire is <span className="font-medium text-ink">Employee</span>. Elevated
          roles are restricted to Admins and are always enforced by the backend, not this screen.
        </p>
      </div>

      <FormField label="Assigned Role" htmlFor="assignedRole" required>
        <FilterDropdown
          label="Select Role"
          options={assignableRoles.map((role) => ({ label: ROLE_LABELS[role], value: role }))}
          value={value.role}
          onChange={(v) => onChange({ role: v as Role })}
          className="sm:w-72"
        />
      </FormField>

      {!canAssignElevatedRoles && (
        <p className="flex items-center gap-1.5 text-fs-sm text-muted-light">
          <Lock className="size-3.5" />
          Only Super Admin and Admin can assign elevated roles (Super Admin, Admin).
        </p>
      )}

      <div className="rounded-xl border border-border bg-surface-card p-4">
        <p className="mb-3 flex items-center gap-2 text-fs-lg font-semibold text-ink">
          <ShieldCheck className="size-4 text-primary" />
          Access Summary — {ROLE_LABELS[value.role]}
        </p>
        {accessibleModules.length === 0 ? (
          <p className="text-fs-base text-muted">This role has no module access by default.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {accessibleModules.map((mod) => (
              <li key={mod.key} className="flex items-center gap-2 text-fs-base text-ink">
                <mod.icon className="size-4 text-muted-light" />
                {mod.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="mb-2 text-fs-lg font-semibold text-ink">Role Permissions</p>
        <p className="mb-3 text-fs-sm text-muted-light">
          Read-only preview of what {ROLE_LABELS[value.role]} can do per module. Final enforcement always happens
          on the backend.
        </p>
        <div className="overflow-x-auto rounded-xl border border-border bg-surface-card">
          <table className="w-full min-w-[640px] border-collapse text-left text-fs-base">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-4 py-2.5 font-semibold text-ink">Module</th>
                {ACTION_KEYS.filter((action) => ["view", "add", "edit", "delete", "approve"].includes(action)).map(
                  (action) => (
                    <th key={action} className="px-3 py-2.5 text-center font-semibold text-ink">
                      {ACTION_LABELS[action]}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {accessibleModules.map((mod) => {
                const perms = rolePermissions[mod.key] ?? {};
                return (
                  <tr key={mod.key} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-2 text-ink">{mod.label}</td>
                    {(["view", "add", "edit", "delete", "approve"] as ActionKey[]).map((action) => (
                      <td key={action} className="px-3 py-2 text-center">
                        {mod.actions.includes(action) ? (
                          <Badge tone={perms[action] ? "success" : "neutral"} className="px-2 py-0.5">
                            {perms[action] ? "Yes" : "No"}
                          </Badge>
                        ) : (
                          <span className={cn("text-muted-light")}>—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});
