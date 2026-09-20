"use client";

import { useEffect, useState } from "react";
import { Briefcase, CheckCircle2 } from "lucide-react";
import { StatCard } from "@/components/molecules/StatCard";
import { Table } from "@/components/molecules/Table";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { Spinner } from "@/components/atoms/Spinner";
import { listMyProjects } from "@/services/project.service";
import { ASSIGNMENT_STATUSES, ASSIGNMENT_STATUS_LABELS, type ProjectAssignment } from "@/types/project";

const ASSIGNMENT_OPTIONS = ASSIGNMENT_STATUSES.map((s) => ({ label: ASSIGNMENT_STATUS_LABELS[s], value: s }));
const PROJECT_STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

/** User > My Projects — the caller's own assignments, with the two independent server filters. */
export function MyProjectsTab() {
  const [assignments, setAssignments] = useState<ProjectAssignment[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [projectStatus, setProjectStatus] = useState("");
  const [prevFilters, setPrevFilters] = useState({ status, projectStatus });

  if (prevFilters.status !== status || prevFilters.projectStatus !== projectStatus) {
    setPrevFilters({ status, projectStatus });
    setAssignments(null);
    setLoadError(null);
  }

  useEffect(() => {
    let isMounted = true;
    listMyProjects({ status, projectStatus })
      .then((data) => {
        if (isMounted) setAssignments(data);
      })
      .catch((err) => {
        if (isMounted) setLoadError(err instanceof Error ? err.message : "Could not load your projects.");
      });
    return () => {
      isMounted = false;
    };
  }, [status, projectStatus]);

  const activeCount = (assignments ?? []).filter((a) => a.status === "active").length;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 rounded-xl border border-border bg-surface-card p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <FilterDropdown label="Any assignment status" ariaLabel="Assignment status" options={ASSIGNMENT_OPTIONS} value={status} onChange={setStatus} className="w-full sm:w-52" />
        <FilterDropdown label="Any project status" ariaLabel="Project status" options={PROJECT_STATUS_OPTIONS} value={projectStatus} onChange={setProjectStatus} className="w-full sm:w-48" />
      </div>

      {loadError ? (
        <p className="rounded-xl border border-dashed border-border bg-surface-card px-6 py-16 text-center text-fs-base text-danger">{loadError}</p>
      ) : !assignments ? (
        <div className="flex items-center justify-center gap-2 py-24 text-muted">
          <Spinner />
          Loading your projects…
        </div>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3">
            <StatCard label="Assigned Projects" value={String(assignments.length)} icon={Briefcase} />
            <StatCard label="Active Assignments" value={String(activeCount)} icon={CheckCircle2} />
          </div>
          <Table
            columns={[
              { key: "name", header: "Project", render: (a: ProjectAssignment) => <span className="font-medium text-ink">{a.projectName}</span> },
              { key: "description", header: "Description", render: (a: ProjectAssignment) => a.projectDescription || "—" },
              { key: "status", header: "My Assignment", render: (a: ProjectAssignment) => <StatusBadge status={ASSIGNMENT_STATUS_LABELS[a.status]} /> },
              { key: "projectStatus", header: "Project Status", render: (a: ProjectAssignment) => <StatusBadge status={a.projectStatus === "active" ? "Active" : "Inactive"} /> },
            ]}
            data={assignments}
            keyField={(a) => a.id || a.projectId}
            emptyMessage="You haven't been assigned to any project yet."
          />
        </>
      )}
    </div>
  );
}
