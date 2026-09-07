"use client";

import { useState } from "react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Tabs } from "@/components/molecules/Tabs";
import { MyDocumentsTab } from "@/components/organisms/documents/MyDocumentsTab";
import { CompanyDocumentsTab } from "@/components/organisms/documents/CompanyDocumentsTab";

const TAB_OPTIONS = [
  { label: "My Documents", value: "mine" },
  { label: "Company Documents", value: "company" },
];

export default function DocumentsPage() {
  const [tab, setTab] = useState("mine");

  return (
    <div>
      <PageHeader title="Documents" description="Employee documents and company-wide policy files" />

      <div className="mb-4">
        <Tabs options={TAB_OPTIONS} value={tab} onChange={setTab} />
      </div>

      {tab === "mine" ? <MyDocumentsTab /> : <CompanyDocumentsTab />}
    </div>
  );
}
