"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { ChevronDown, Lock, Plus, RotateCcw, Search, ShieldCheck, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/atoms/Checkbox";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { Input } from "@/components/atoms/Input";
import { Spinner } from "@/components/atoms/Spinner";
import { useToast } from "@/hooks/use-toast";
import { useRoles } from "@/hooks/use-roles";
import { CreateRoleModal } from "@/components/organisms/rbac/CreateRoleModal";
import { MODULE_DEFS, MODULE_GROUPS } from "@/lib/rbac/modules";
import { ACTION_KEYS, ACTION_LABELS, type ModuleKey, type RolePermissionMap } from "@/types/rbac";
import type { ApiRole } from "@/types/role";
import { cn } from "@/lib/cn";

function countGrantedModules(permissions: RolePermissionMap) {
  return MODULE_DEFS.filter((mod) => Object.values(permissions[mod.key] ?? {}).some(Boolean)).length;
}

export function RoleAccessMatrix() {
  const { roles, isLoading, error, createRole, updateRole, deleteRole } = useRoles();
  const { showToast } = useToast();

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [draftPermissions, setDraftPermissions] = useState<RolePermissionMap>({});
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [roleSearch, setRoleSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Default to the first role once the list loads, and follow along if the
  // selected role gets deleted out from under it.
  useEffect(() => {
    if (roles.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedRoleId(null);
      return;
    }
    if (!selectedRoleId || !roles.some((r) => r.id === selectedRoleId)) {
      selectRole(roles[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles]);

  const selectedRole = useMemo(() => roles.find((r) => r.id === selectedRoleId) ?? null, [roles, selectedRoleId]);

  const isDirty = useMemo(() => {
    if (!selectedRole) return false;
    return JSON.stringify(selectedRole.permissions) !== JSON.stringify(draftPermissions);
  }, [selectedRole, draftPermissions]);

  const grantedModuleCount = useMemo(() => countGrantedModules(draftPermissions), [draftPermissions]);

  const filteredRoles = useMemo(() => {
    const query = roleSearch.trim().toLowerCase();
    if (!query) return roles;
    return roles.filter((role) => role.label.toLowerCase().includes(query) || role.name.toLowerCase().includes(query));
  }, [roles, roleSearch]);

  function selectRole(role: ApiRole) {
    setSelectedRoleId(role.id);
    setDraftPermissions(role.permissions);
  }

  function toggleGroup(group: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }

  function updateDraftPermission(moduleKey: ModuleKey, action: string, value: boolean) {
    setDraftPermissions((prev) => ({
      ...prev,
      [moduleKey]: { ...prev[moduleKey], [action]: value },
    }));
  }

  function setAllDraftPermissionsForModule(moduleKey: ModuleKey, actions: string[], value: boolean) {
    setDraftPermissions((prev) => {
      const nextModule = { ...prev[moduleKey] };
      actions.forEach((action) => {
        nextModule[action as keyof typeof nextModule] = value;
      });
      return { ...prev, [moduleKey]: nextModule };
    });
  }

  function discardChanges() {
    if (selectedRole) setDraftPermissions(selectedRole.permissions);
  }

  async function handleSave() {
    if (!selectedRole) return;
    setIsSaving(true);
    try {
      await updateRole(selectedRole.id, { permissions: draftPermissions });
      showToast(`Saved permissions for ${selectedRole.label}.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save permissions.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreate(payload: { name: string; label: string }) {
    setIsCreating(true);
    try {
      const role = await createRole({ ...payload, permissions: {} });
      showToast(`${role.label} role created.`);
      setIsCreateOpen(false);
      selectRole(role);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to create role.", "error");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDelete() {
    if (!selectedRole) return;
    if (!window.confirm(`Delete the "${selectedRole.label}" role? This cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      await deleteRole(selectedRole.id);
      showToast(`${selectedRole.label} role deleted.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to delete role.", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading && roles.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-card py-24 text-muted">
        <Spinner />
        Loading roles…
      </div>
    );
  }

  if (error && roles.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface-card p-8 text-center text-fs-base text-muted">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      {/* Role list */}
      <aside className="flex w-full shrink-0 flex-col rounded-xl border border-border bg-surface-card lg:w-72">
        <div className="flex items-center justify-between gap-2 border-b border-border p-3">
          <h2 className="px-1 text-fs-lg font-semibold text-ink">Roles</h2>
          <Button size="sm" variant="ghost" onClick={() => setIsCreateOpen(true)}>
            <Plus className="size-3.5" />
            New
          </Button>
        </div>

        {roles.length > 5 && (
          <div className="relative border-b border-border p-2">
            <Search className="pointer-events-none absolute left-5 top-1/2 size-3.5 -translate-y-1/2 text-muted-light" />
            <Input
              value={roleSearch}
              onChange={(e) => setRoleSearch(e.target.value)}
              placeholder="Search roles…"
              className="h-9 pl-8 text-fs-base"
            />
          </div>
        )}

        <div className="flex max-h-[32rem] flex-col gap-0.5 overflow-y-auto p-2 lg:max-h-[calc(100vh-16rem)]">
          {filteredRoles.length === 0 ? (
            <p className="px-3 py-6 text-center text-fs-sm text-muted-light">No roles match &ldquo;{roleSearch}&rdquo;.</p>
          ) : (
            filteredRoles.map((role) => {
              const isActive = role.id === selectedRoleId;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => selectRole(role)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors",
                    isActive ? "bg-primary-soft text-primary" : "text-ink hover:bg-surface"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg",
                      isActive ? "bg-primary text-white" : "bg-surface text-muted-light"
                    )}
                  >
                    <ShieldCheck className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-fs-base font-medium">{role.label}</span>
                      {role.isSystem && <Lock className="size-3 shrink-0 text-muted-light" />}
                    </span>
                    <span className={cn("block truncate text-fs-sm", isActive ? "text-primary/80" : "text-muted")}>
                      {countGrantedModules(role.permissions)} of {MODULE_DEFS.length} modules
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Permission matrix for the selected role */}
      <div className="min-w-0 flex-1">
        {!selectedRole ? (
          <div className="rounded-xl border border-border bg-surface-card p-8 text-center text-fs-base text-muted">
            No roles yet — create one to start configuring permissions.
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-surface-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-fs-xl font-semibold text-ink">{selectedRole.label}</h3>
                  {selectedRole.isSystem && (
                    <Badge tone="neutral">
                      <Lock className="size-3" />
                      System
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-fs-sm text-muted">
                  <span className="font-semibold text-ink">{grantedModuleCount}</span> of {MODULE_DEFS.length} modules
                  granted
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={discardChanges} disabled={!isDirty}>
                  <RotateCcw className="size-3.5" />
                  Discard
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  isLoading={isDeleting}
                  disabled={selectedRole.isSystem}
                  title={selectedRole.isSystem ? "System roles can't be deleted." : undefined}
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </Button>
                <Button size="sm" onClick={handleSave} isLoading={isSaving} disabled={!isDirty}>
                  Save Changes
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
                            const modulePermissions = draftPermissions[mod.key] ?? {};
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
                                        onChange={(event) => updateDraftPermission(mod.key, action, event.target.checked)}
                                        aria-label={`${selectedRole.label} — ${mod.label} — ${ACTION_LABELS[action]}`}
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
                                      setAllDraftPermissionsForModule(mod.key, mod.actions, event.target.checked)
                                    }
                                    aria-label={`${selectedRole.label} — ${mod.label} — select all`}
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
              Changes are saved to this role directly — use &ldquo;Save Changes&rdquo; to apply them, or &ldquo;Discard&rdquo;
              to revert.
            </p>
          </>
        )}
      </div>

      <CreateRoleModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreate}
        isSubmitting={isCreating}
      />
    </div>
  );
}
