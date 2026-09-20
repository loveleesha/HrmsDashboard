"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { buildHierarchy } from "@/services/hierarchy.service";
import type { HierarchyData, HierarchySearchResult } from "@/types/hierarchy";

export interface HierarchyFilters {
  projectId: string;
  managerId: string;
  department: string;
  employeeStatus: string;
  projectStatus: string;
}

export const EMPTY_HIERARCHY_FILTERS: HierarchyFilters = {
  projectId: "",
  managerId: "",
  department: "",
  employeeStatus: "",
  projectStatus: "",
};

export function projectKey(projectId: string) {
  return `project:${projectId}`;
}
export function managerKey(topProjectId: string, managerId: string) {
  return `manager:${topProjectId}:${managerId}`;
}
export function managerProjectKey(topProjectId: string, managerId: string, ownProjectId: string) {
  return `mproject:${topProjectId}:${managerId}:${ownProjectId}`;
}

/**
 * Data loading, expand/collapse state, debounced search, and filters for the
 * Project & Team Hierarchy tree. Zoom/pan is deliberately not here — that's
 * pure canvas presentation state owned by HierarchyTree itself.
 *
 * `enabled` gates the fetch itself — buildHierarchy composes admin-tier
 * endpoints (project-assignments, employees) a plain self-service role
 * doesn't have access to, so the page passes `can("projects", "edit")` here
 * and shows an access-restricted state instead of ever issuing requests
 * that would just 403.
 */
export function useHierarchy(enabled = true) {
  const [data, setData] = useState<HierarchyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<HierarchyFilters>(EMPTY_HIERARCHY_FILTERS);
  const [highlightKey, setHighlightKey] = useState<string | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    buildHierarchy()
      .then((result) => {
        setData(result);
        // Only the top-level projects open by default — everything below
        // stays collapsed until asked for, per the "don't expand everything
        // by default" requirement.
        setExpanded(new Set(result.projects.slice(0, 3).map((p) => projectKey(p.id))));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load the project hierarchy."))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!enabled) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [enabled, load]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const toggle = useCallback((key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const expand = useCallback((key: string) => {
    setExpanded((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  }, []);

  const expandPath = useCallback((path: string[]) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      path.forEach((key) => next.add(key));
      return next;
    });
  }, []);

  const allKeys = useMemo(() => {
    if (!data) return [];
    const keys: string[] = [];
    for (const project of data.projects) {
      keys.push(projectKey(project.id));
      for (const manager of project.managers) {
        keys.push(managerKey(project.id, manager.userId));
        const context = data.managerContexts.get(manager.userId);
        for (const ownProject of context?.ownProjects ?? []) {
          keys.push(managerProjectKey(project.id, manager.userId, ownProject.projectId));
        }
      }
    }
    return keys;
  }, [data]);

  const expandAll = useCallback(() => setExpanded(new Set(allKeys)), [allKeys]);
  const collapseAll = useCallback(() => setExpanded(new Set()), []);

  const searchResults = useMemo<HierarchySearchResult[]>(() => {
    if (!data || !debouncedSearch) return [];
    const q = debouncedSearch.toLowerCase();
    const results: HierarchySearchResult[] = [];
    const matches = (...values: (string | undefined)[]) => values.some((v) => v?.toLowerCase().includes(q));

    for (const project of data.projects) {
      if (matches(project.name, project.id)) {
        results.push({ kind: "project", id: project.id, label: project.name, sublabel: "Project", path: [projectKey(project.id)] });
      }
      for (const manager of project.managers) {
        if (matches(manager.name, manager.employeeId)) {
          results.push({
            kind: "manager",
            id: `${project.id}:${manager.userId}`,
            label: manager.name,
            sublabel: manager.designation || "Manager",
            path: [projectKey(project.id), managerKey(project.id, manager.userId)],
          });
        }
        const context = data.managerContexts.get(manager.userId);
        for (const ownProject of context?.ownProjects ?? []) {
          for (const employee of ownProject.employees) {
            if (matches(employee.name, employee.employeeId)) {
              results.push({
                kind: "employee",
                id: `${project.id}:${manager.userId}:${ownProject.projectId}:${employee.userId}`,
                label: employee.name,
                sublabel: employee.designation,
                path: [
                  projectKey(project.id),
                  managerKey(project.id, manager.userId),
                  managerProjectKey(project.id, manager.userId, ownProject.projectId),
                ],
              });
            }
          }
        }
      }
    }
    return results.slice(0, 50);
  }, [data, debouncedSearch]);

  const goToResult = useCallback(
    (result: HierarchySearchResult) => {
      expandPath(result.path);
      setHighlightKey(result.path[result.path.length - 1]);
      setSearch("");
    },
    [expandPath]
  );

  return {
    data,
    error,
    isLoading,
    reload: load,
    expanded,
    toggle,
    expand,
    expandAll,
    collapseAll,
    search,
    setSearch,
    searchResults,
    goToResult,
    filters,
    setFilters,
    highlightKey,
    setHighlightKey,
  };
}

export type UseHierarchyReturn = ReturnType<typeof useHierarchy>;
