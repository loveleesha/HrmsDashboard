"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import { Modal } from "@/components/molecules/Modal";
import { FormField } from "@/components/molecules/FormField";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { Avatar } from "@/components/atoms/Avatar";
import type { HierarchyEmployeeRef } from "@/types/hierarchy";

export interface AssignEmployeeProjectOption {
  id: string;
  name: string;
}

export interface AssignEmployeeModalProps {
  open: boolean;
  onClose: () => void;
  /** Present → opened from a Manager node. The project itself must then be
   * chosen from that manager's own projects (projectOptions) instead of
   * being implied by whatever top-level project the manager happened to be
   * expanded under. */
  manager?: HierarchyEmployeeRef | null;
  /** A single fixed entry when opened from a Project node; several when
   * opened from a Manager node (their own projects) — always required. */
  projectOptions: AssignEmployeeProjectOption[];
  /** Employees not already assigned to the given project. */
  getCandidates: (projectId: string) => HierarchyEmployeeRef[];
  onSubmit: (params: { employeeUserId: string; projectId: string }) => void;
  isSubmitting?: boolean;
}

/** Wraps Admin > Project Assignments > Assign Project to Employee. The
 * "Manager" shown is informational only (this project's assignment doesn't
 * itself carry a manager link — the tree derives that from Employee.manager
 * matching a name), not something this call sets. */
export function AssignEmployeeModal({ open, onClose, manager, projectOptions, getCandidates, onSubmit, isSubmitting }: AssignEmployeeModalProps) {
  const [projectId, setProjectId] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<HierarchyEmployeeRef | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);

  const inputWrapRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setProjectId(projectOptions.length === 1 ? projectOptions[0].id : "");
      setQuery("");
      setSelected(null);
      setError(null);
    }
  }

  const showDropdown = query.trim().length > 0 && Boolean(projectId);
  const candidates = projectId ? getCandidates(projectId) : [];
  const matches = showDropdown
    ? candidates
        .filter(
          (c) => c.name.toLowerCase().includes(query.trim().toLowerCase()) || c.employeeId?.toLowerCase().includes(query.trim().toLowerCase())
        )
        .slice(0, 8)
    : [];

  // The search input lives inside Modal's overflow-y-auto body, which clips
  // any absolutely-positioned child that would render outside its bounds —
  // portal the dropdown to document.body instead (same fix as ActionMenu.tsx).
  useEffect(() => {
    if (!showDropdown) return;

    function updatePosition() {
      const rect = inputWrapRef.current?.getBoundingClientRect();
      if (!rect) return;
      setDropdownRect({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    updatePosition();

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [showDropdown, query]);

  function handleSubmit() {
    if (!projectId) {
      setError("Select a project.");
      return;
    }
    if (!selected) {
      setError("Search for and select an employee.");
      return;
    }
    onSubmit({ employeeUserId: selected.userId, projectId });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign Employee"
      description={manager ? `${manager.name}'s project` : projectOptions[0]?.name}
      widthClassName="sm:max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            Assign
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {manager && (
          <FormField label="Manager" htmlFor="assign-employee-manager">
            <Input id="assign-employee-manager" value={manager.name} disabled />
          </FormField>
        )}

        {projectOptions.length > 1 ? (
          <FormField label="Project" htmlFor="assign-employee-project" required error={!projectId ? error ?? undefined : undefined}>
            <FilterDropdown
              label="Select Project"
              options={projectOptions.map((p) => ({ label: p.name, value: p.id }))}
              value={projectId}
              onChange={(value) => {
                setProjectId(value);
                setSelected(null);
                setError(null);
              }}
            />
          </FormField>
        ) : (
          <FormField label="Project" htmlFor="assign-employee-project">
            <Input id="assign-employee-project" value={projectOptions[0]?.name ?? ""} disabled />
          </FormField>
        )}

        <FormField label="Employee" htmlFor="assign-employee-search" error={projectId ? (error ?? undefined) : undefined} required>
          {selected ? (
            <div className="flex items-center gap-2.5 rounded-lg border border-border bg-surface-card p-2.5">
              <Avatar name={selected.name} imageUrl={selected.avatarUrl} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-fs-base font-medium text-ink">{selected.name}</p>
                <p className="truncate text-fs-sm text-muted-light">{selected.employeeId ?? "—"}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)} aria-label="Change employee">
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <div ref={inputWrapRef} className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-light" />
              <Input
                id="assign-employee-search"
                placeholder={projectId ? "Search employee…" : "Select a project first"}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={!projectId}
                className="pl-9"
              />
            </div>
          )}
        </FormField>
      </div>

      {showDropdown &&
        dropdownRect &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{ position: "fixed", top: dropdownRect.top, left: dropdownRect.left, width: dropdownRect.width }}
            className="z-[200] max-h-56 overflow-y-auto rounded-lg border border-border bg-surface-card shadow-lg"
          >
            {matches.length === 0 ? (
              <p className="px-3 py-3 text-fs-sm text-muted">No matching employees.</p>
            ) : (
              matches.map((candidate) => (
                <button
                  key={candidate.userId}
                  type="button"
                  onClick={() => {
                    setSelected(candidate);
                    setQuery("");
                    setError(null);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-surface"
                >
                  <Avatar name={candidate.name} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-fs-base text-ink">{candidate.name}</span>
                    <span className="block truncate text-fs-sm text-muted-light">{candidate.designation || "—"}</span>
                  </span>
                </button>
              ))
            )}
          </div>,
          document.body
        )}
    </Modal>
  );
}
