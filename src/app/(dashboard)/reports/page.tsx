"use client";

import { Download, FileBarChart } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Table } from "@/components/molecules/Table";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/use-rbac";

interface ReportDef {
  id: string;
  name: string;
  module: string;
  description: string;
  lastGenerated: string;
}

const REPORTS: ReportDef[] = [
  { id: "RPT-01", name: "Headcount Report", module: "Employees", description: "Active employees by department, location, and level.", lastGenerated: "2026-09-06" },
  { id: "RPT-02", name: "Attendance Summary", module: "Attendance", description: "Monthly attendance, late marks, and absenteeism trends.", lastGenerated: "2026-09-05" },
  { id: "RPT-03", name: "Leave Utilization", module: "Leave", description: "Leave taken vs. balance by leave type and department.", lastGenerated: "2026-09-01" },
  { id: "RPT-04", name: "Payroll Summary", module: "Payroll", description: "Gross-to-net breakdown for the latest payroll cycle.", lastGenerated: "2026-08-31" },
  { id: "RPT-05", name: "Recruitment Funnel", module: "Recruitment", description: "Candidates by stage, source, and time-to-hire.", lastGenerated: "2026-09-04" },
  { id: "RPT-06", name: "Expense Reimbursements", module: "Expenses", description: "Submitted, approved, and reimbursed expenses by category.", lastGenerated: "2026-09-02" },
  { id: "RPT-07", name: "Performance Review Status", module: "Performance", description: "Review cycle completion by manager and department.", lastGenerated: "2026-08-28" },
];

export default function ReportsPage() {
  const { showToast } = useToast();
  const { can } = useRBAC();
  const canExport = can("reports", "export");

  return (
    <div>
      <PageHeader title="Reports" description="Analytics and exportable reports" />

      <Table
        columns={[
          {
            key: "name",
            header: "Report",
            render: (r: ReportDef) => (
              <div className="flex items-center gap-2">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <FileBarChart className="size-4" />
                </span>
                <span className="font-medium text-ink">{r.name}</span>
              </div>
            ),
          },
          { key: "module", header: "Module", render: (r: ReportDef) => <Badge tone="neutral">{r.module}</Badge> },
          { key: "description", header: "Description", render: (r: ReportDef) => <span className="text-muted">{r.description}</span> },
          {
            key: "lastGenerated",
            header: "Last Generated",
            render: (r: ReportDef) => new Date(r.lastGenerated).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
          },
          ...(canExport
            ? [
                {
                  key: "actions",
                  header: "",
                  render: (r: ReportDef) => (
                    <Button variant="secondary" size="sm" onClick={() => showToast(`${r.name} exported.`)}>
                      <Download className="size-3.5" />
                      Export
                    </Button>
                  ),
                },
              ]
            : []),
        ]}
        data={REPORTS}
        keyField={(r) => r.id}
      />
    </div>
  );
}
