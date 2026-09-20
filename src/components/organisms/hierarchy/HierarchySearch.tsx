"use client";

import { FolderKanban, User, Users } from "lucide-react";
import { SearchInput } from "@/components/molecules/SearchInput";
import type { HierarchySearchResult } from "@/types/hierarchy";

const KIND_ICON = { project: FolderKanban, manager: Users, employee: User } as const;

export interface HierarchySearchProps {
  value: string;
  onChange: (value: string) => void;
  results: HierarchySearchResult[];
  onSelect: (result: HierarchySearchResult) => void;
}

export function HierarchySearch({ value, onChange, results, onSelect }: HierarchySearchProps) {
  return (
    <div className="relative w-full sm:w-80">
      <SearchInput
        placeholder="Search project, manager, or employee…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value.trim() && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full max-h-80 overflow-y-auto rounded-lg border border-border bg-surface-card shadow-lg">
          {results.map((result) => {
            const Icon = KIND_ICON[result.kind];
            return (
              <button
                key={`${result.kind}-${result.id}`}
                type="button"
                onClick={() => onSelect(result)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-surface"
              >
                <Icon className="size-4 shrink-0 text-muted-light" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-fs-base text-ink">{result.label}</span>
                  {result.sublabel && <span className="block truncate text-fs-sm text-muted-light">{result.sublabel}</span>}
                </span>
              </button>
            );
          })}
        </div>
      )}
      {value.trim() && results.length === 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-surface-card p-3 text-center text-fs-sm text-muted shadow-lg">
          No matches.
        </div>
      )}
    </div>
  );
}
