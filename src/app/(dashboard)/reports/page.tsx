"use client";

import { useEffect, useState } from "react";
import { Download, FileBarChart } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Table } from "@/components/molecules/Table";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { Spinner } from "@/components/atoms/Spinner";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/use-rbac";
import { getReports, exportReport, type ReportDef } from "@/services/reports.service";

export default function ReportsPage() {
  const { showToast } = useToast();
  const { can } = useRBAC();
  const canView = can("reports", "view");
  const canExport = can("reports", "export");

  const [reports, setReports] = useState<ReportDef[] | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);

  useEffect(() => {
    if (!canView) return;
    let isMounted = true;
    getReports().then((data) => isMounted && setReports(data));
    return () => {
      isMounted = false;
    };
  }, [canView]);

  function handleExport(report: ReportDef) {
    setExportingId(report.id);
    exportReport(report.id, report.name)
      .catch(() => showToast(`Couldn't export ${report.name}. Please try again.`))
      .finally(() => setExportingId(null));
  }

  if (!canView) {
    return (
      <div>
        <PageHeader title="Reports" description="Analytics and exportable reports" />
        <p className="py-16 text-center text-muted">You don&apos;t have permission to view reports.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Reports" description="Analytics and exportable reports" />

      {!reports ? (
        <div className="flex items-center justify-center gap-2 py-24 text-muted">
          <Spinner />
          Loading reports…
        </div>
      ) : (
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
              render: (r: ReportDef) =>
                new Date(r.lastGenerated).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
            },
            ...(canExport
              ? [
                  {
                    key: "actions",
                    header: "",
                    render: (r: ReportDef) => (
                      <Button variant="secondary" size="sm" disabled={exportingId === r.id} onClick={() => handleExport(r)}>
                        <Download className="size-3.5" />
                        {exportingId === r.id ? "Exporting…" : "Export"}
                      </Button>
                    ),
                  },
                ]
              : []),
          ]}
          data={reports}
          keyField={(r) => r.id}
        />
      )}
    </div>
  );
}
