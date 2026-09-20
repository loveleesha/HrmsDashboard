"use client";

import { useEffect, useState } from "react";
import { listMyProjects } from "@/services/project.service";

export interface AssignedProjectOption {
  id: string;
  name: string;
}

/**
 * The projects the signed-in employee can log work against: their own
 * assignments (User > My Projects) that are still active, on a project that's
 * still active. Loading and a failed load both look like "none" — the DSR
 * form always still offers Miscellaneous.
 */
export function useAssignedProjects(): { projects: AssignedProjectOption[]; isLoading: boolean } {
  const [projects, setProjects] = useState<AssignedProjectOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    listMyProjects({ status: "active", projectStatus: "active" })
      .then((assignments) => {
        if (!isMounted) return;
        const seen = new Set<string>();
        setProjects(
          assignments
            .filter((a) => a.projectId && !seen.has(a.projectId) && seen.add(a.projectId))
            .map((a) => ({ id: a.projectId, name: a.projectName }))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return { projects, isLoading };
}
