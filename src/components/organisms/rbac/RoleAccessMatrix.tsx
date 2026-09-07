"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronDown, RotateCcw } from "lucide-react";
import { Checkbox } from "@/components/atoms/Checkbox";
import { Button } from "@/components/atoms/Button";
import { Tabs } from "@/components/molecules/Tabs";
import { useRBAC } from "@/hooks/use-rbac";
import { MODULE_DEFS, MODULE_GROUPS } from "@/lib/rbac/modules";
import { ACTION_KEYS, ACTION_LABELS } from "@/types/rbac";
import { ROLES, ROLE_LABELS, type Role } from "@/types/user";
import { cn } from "@/lib/cn";

export function RoleAccessMatrix() {
  const { permissionMatrix, updatePermission, setAllPermissionsForModule, resetPermissions } = useRBAC();
  const [selectedRole, setSelectedRole] = useState<Role>("hr_admin");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const rolePermissions = useMemo(() => permissionMatrix[selectedRole] ?? {}, [permissionMatrix, selectedRole]);

  const grantedModuleCount = useMemo(
    () => MODULE_DEFS.filter((mod) => Object.values(rolePermissions[mod.key] ?? {}).some(Boolean)).length,
    [rolePermissions]
  );

  function toggleGroup(group: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-surface-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-2 text-fs-base font-medium text-ink">Select a role to configure</p>
          <Tabs
            options={ROLES.map((role) => ({ label: ROLE_LABELS[role], value: role }))}
            value={selectedRole}
            onChange={(value) => setSelectedRole(value as Role)}
            className="flex-wrap"
          />
        </div>
        <div className="flex items-center gap-3 sm:flex-col sm:items-end">
          <p className="text-fs-sm text-muted">
            {ROLE_LABELS[selectedRole]} has access to{" "}
            <span className="font-semibold text-ink">{grantedModuleCount}</span> of {MODULE_DEFS.length} modules
          </p>
          <Button variant="ghost" size="sm" onClick={resetPermissions}>
            <RotateCcw className="size-3.5" />
            Reset to Defaults
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface-card">
        <table className="w-full min-w-[860px] border-collapse text-left text-fs-base">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="sticky left-0 z-10 bg-surface px-4 py-3 font-semibold text-ink">Module</th>
              {ACTION_KEYS.map((action) => (
                <th key={action} className="px-3 py-3 text-center font-semibold text-ink">
                  {ACTION_LABELS[action]}
                </th>
              ))}
              <th className="px-3 py-3 text-center font-semibold text-ink">All</th>
            </tr>
          </thead>
          <tbody>
            {MODULE_GROUPS.map((group) => {
              const groupModules = MODULE_DEFS.filter((mod) => mod.group === group);
              const isCollapsed = collapsedGroups.has(group);

              return (
                <Fragment key={group}>
                  <tr className="border-b border-border bg-surface/60">
                    <td colSpan={ACTION_KEYS.length + 2} className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => toggleGroup(group)}
                        className="flex items-center gap-1.5 text-fs-sm font-semibold uppercase tracking-wide text-muted-light"
                      >
                        <ChevronDown className={cn("size-3.5 transition-transform", isCollapsed && "-rotate-90")} />
                        {group}
                      </button>
                    </td>
                  </tr>

                  {!isCollapsed &&
                    groupModules.map((mod) => {
                      const modulePermissions = rolePermissions[mod.key] ?? {};
                      const supportedActions = new Set(mod.actions);
                      const allGranted = mod.actions.every((action) => modulePermissions[action]);
                      const someGranted = mod.actions.some((action) => modulePermissions[action]);

                      return (
                        <tr key={mod.key} className="border-b border-border last:border-b-0 hover:bg-surface/40">
                          <td className="sticky left-0 z-10 bg-surface-card px-4 py-2.5">
                            <span className="flex items-center gap-2 text-ink">
                              <mod.icon className="size-4 text-muted-light" />
                              {mod.label}
                            </span>
                          </td>
                          {ACTION_KEYS.map((action) => (
                            <td key={action} className="px-3 py-2.5 text-center">
                              {supportedActions.has(action) ? (
                                <Checkbox
                                  checked={Boolean(modulePermissions[action])}
                                  onChange={(event) =>
                                    updatePermission(selectedRole, mod.key, action, event.target.checked)
                                  }
                                  aria-label={`${ROLE_LABELS[selectedRole]} — ${mod.label} — ${ACTION_LABELS[action]}`}
                                />
                              ) : (
                                <span className="text-muted-light">—</span>
                              )}
                            </td>
                          ))}
                          <td className="px-3 py-2.5 text-center">
                            <Checkbox
                              checked={allGranted}
                              ref={(el) => {
                                if (el) el.indeterminate = someGranted && !allGranted;
                              }}
                              onChange={(event) =>
                                setAllPermissionsForModule(selectedRole, mod.key, mod.actions, event.target.checked)
                              }
                              aria-label={`${ROLE_LABELS[selectedRole]} — ${mod.label} — select all`}
                            />
                          </td>
                        </tr>
                      );
                    })}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-fs-sm text-muted-light">
        Changes apply immediately — switch &ldquo;View As&rdquo; in the header to see them take effect across the
        sidebar, pages, and action buttons.
      </p>
    </div>
  );
}
