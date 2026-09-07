"use client";

import { useEffect, useState } from "react";
import { Briefcase, Clock } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { StatCard } from "@/components/molecules/StatCard";
import { Table } from "@/components/molecules/Table";
import { Badge } from "@/components/atoms/Badge";
import { Spinner } from "@/components/atoms/Spinner";
import { getMyAllocations } from "@/services/project.service";
import type { ProjectAllocation } from "@/types/project";

export default function ProjectsPage() {
  const [allocations, setAllocations] = useState<ProjectAllocation[] | null>(null);

  useEffect(() => {
    let isMounted = true;
    getMyAllocations().then((data) => {
      if (isMounted) setAllocations(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const totalHours = allocations?.reduce((sum, a) => sum + a.dsrLoggedHours, 0) ?? 0;

  return (
    <div>
      <PageHeader
        title="My Projects & Hours"
        description="All the projects you have worked on, with your DSR-logged hours."
      />

      {!allocations ? (
        <div className="flex items-center justify-center gap-2 py-24 text-muted">
          <Spinner />
          Loading projects…
        </div>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <StatCard label="Total Projects" value={String(allocations.length)} icon={Briefcase} />
            <StatCard
              label="Total DSR Logged Hours"
              value={totalHours.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              icon={Clock}
            />
          </div>

          <p className="mb-3 rounded-lg bg-warning-bg px-3 py-2 text-fs-sm text-warning">
            DSR logged hours reflect data recorded from January 2026 onwards.
          </p>

          <Table
            columns={[
              { key: "name", header: "Project Name", render: (a) => <span className="font-medium text-ink">{a.projectName}</span> },
              { key: "alloc", header: "Allocated Hrs/Day", render: (a) => a.allocatedHoursPerDay.toFixed(2) },
              {
                key: "status",
                header: "Status",
                render: (a) => <Badge tone={a.status === "Active" ? "success" : "danger"}>{a.status}</Badge>,
              },
              { key: "hours", header: "DSR Logged Hrs", render: (a) => `${a.dsrLoggedHours.toLocaleString("en-IN", { maximumFractionDigits: 2 })} hrs` },
            ]}
            data={allocations}
            keyField={(a) => a.projectId}
            emptyMessage="No project allocations yet."
          />
        </>
      )}
    </div>
  );
}
