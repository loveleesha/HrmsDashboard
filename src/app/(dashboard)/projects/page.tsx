"use client";

import { useState } from "react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Tabs } from "@/components/molecules/Tabs";
import { MyProjectsTab } from "@/components/organisms/projects/MyProjectsTab";
import { ProjectDirectoryTab } from "@/components/organisms/projects/ProjectDirectoryTab";
import { ProjectAssignmentsTab } from "@/components/organisms/projects/ProjectAssignmentsTab";
import { useRBAC } from "@/hooks/use-rbac";

export default function ProjectsPage() {
  const { can, isAdminAccount } = useRBAC();
  // Listing every assignment needs projects.edit (admin-tier) — projects.view alone, which every role has, isn't enough.
  const canSeeAssignments = can("projects", "edit");
  const [requestedTab, setTab] = useState("mine");
  // Admin-tier accounts have no Employee record, so "My Projects" (projects
  // assigned to *me*) never applies — fall back to "All Projects" instead.
  const tab =
    requestedTab === "assignments" && !canSeeAssignments
      ? "mine"
      : requestedTab === "mine" && isAdminAccount
        ? "all"
        : requestedTab;

  const options = [
    ...(isAdminAccount ? [] : [{ label: "My Projects", value: "mine" }]),
    { label: "All Projects", value: "all" },
    ...(canSeeAssignments ? [{ label: "Assignments", value: "assignments" }] : []),
  ];

  return (
    <div>
      <PageHeader title="Projects" description="Your assigned projects and the company's project list." />
      <div className="mb-4">
        <Tabs options={options} value={tab} onChange={setTab} />
      </div>
      {tab === "mine" && <MyProjectsTab />}
      {tab === "all" && <ProjectDirectoryTab />}
      {tab === "assignments" && <ProjectAssignmentsTab />}
    </div>
  );
}
