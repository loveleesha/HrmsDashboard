"use client";

import { useState } from "react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Tabs } from "@/components/molecules/Tabs";
import { RoleAccessMatrix } from "@/components/organisms/rbac/RoleAccessMatrix";
import { AssignRolesTable } from "@/components/organisms/rbac/AssignRolesTable";

const TAB_OPTIONS = [
  { label: "Permissions", value: "permissions" },
  { label: "Assign Roles", value: "assign" },
];

export default function RoleAccessPage() {
  const [tab, setTab] = useState("permissions");

  return (
    <div>
      <PageHeader
        title="Role & Access"
        description="Configure what each role can view, add, edit, delete, and approve across the app."
      />
      <div className="mb-4">
        <Tabs options={TAB_OPTIONS} value={tab} onChange={setTab} />
      </div>
      {tab === "permissions" ? <RoleAccessMatrix /> : <AssignRolesTable />}
    </div>
  );
}
