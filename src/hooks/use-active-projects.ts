"use client";

import { useEffect, useState } from "react";
import { listProjects } from "@/services/project.service";
import type { ApiProject } from "@/types/project";

/** Active projects for a dropdown (e.g. DSR) — a failed load just leaves the list empty. */
export function useActiveProjects(): ApiProject[] {
  const [projects, setProjects] = useState<ApiProject[]>([]);

  useEffect(() => {
    let isMounted = true;
    listProjects("active")
      .then((data) => {
        if (isMounted) setProjects(data);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  return projects;
}
