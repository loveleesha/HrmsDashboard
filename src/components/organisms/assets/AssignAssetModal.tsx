"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import { Modal } from "@/components/molecules/Modal";
import { FormField } from "@/components/molecules/FormField";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { Avatar } from "@/components/atoms/Avatar";
import type { AssetItem } from "@/types/asset";
import type { Employee } from "@/types/employee";

export interface AssignAssetModalProps {
  open: boolean;
  onClose: () => void;
  asset: AssetItem | null;
  employees: Employee[];
  onSubmit: (userId: string) => void;
  isSubmitting?: boolean;
}

/** Admin > Assets > Assign Asset to Employee — 409 unless the asset is
 * currently "Available". The Postman collection's own note says this wants
 * the Employee document's own _id rather than userId, but the real
 * admin/employees list endpoint never actually exposes that _id (only
 * userId and the human employeeId code) — so, like Project Assignments
 * elsewhere in this app, this sends userId, which is the only id this list
 * ever has to offer. */
export function AssignAssetModal({ open, onClose, asset, employees, onSubmit, isSubmitting }: AssignAssetModalProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Employee | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);

  const inputWrapRef = useRef<HTMLDivElement>(null);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);

  // Re-seed on every open — adjusted during render, not an effect, so it
  // happens before paint instead of causing an extra render.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setQuery("");
      setSelected(null);
      setError(null);
    }
  }

  const showDropdown = query.trim().length > 0;
  const matches = showDropdown
    ? employees
        .filter((e) => e.name.toLowerCase().includes(query.trim().toLowerCase()) || e.employeeId?.toLowerCase().includes(query.trim().toLowerCase()))
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
    if (!selected) {
      setError("Search for and select an employee.");
      return;
    }
    onSubmit(selected.id);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign Asset"
      description={asset ? `${asset.name} · ${asset.category}` : undefined}
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
      <FormField label="Employee" htmlFor="assign-asset-employee" error={error ?? undefined} required>
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
              id="assign-asset-employee"
              placeholder="Search employee…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
      </FormField>

      {showDropdown &&
        dropdownRect &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            style={{ position: "fixed", top: dropdownRect.top, left: dropdownRect.left, width: dropdownRect.width }}
            className="z-[200] max-h-56 overflow-y-auto rounded-lg border border-border bg-surface-card shadow-lg"
          >
            {matches.length === 0 ? (
              <p className="px-3 py-3 text-fs-sm text-muted">No matching employees.</p>
            ) : (
              matches.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => {
                    setSelected(candidate);
                    setQuery("");
                    setError(null);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-surface"
                >
                  <Avatar name={candidate.name} imageUrl={candidate.avatarUrl} size="sm" />
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
