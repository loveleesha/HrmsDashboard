"use client";

import { useEffect, useMemo, useState } from "react";
import { Wallet, TrendingDown, TrendingUp, Download, PlayCircle } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { StatCard } from "@/components/molecules/StatCard";
import { Tabs } from "@/components/molecules/Tabs";
import { Table } from "@/components/molecules/Table";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/use-rbac";
import { getMySalaryComponents, getMyPayslips, getCompanyPayroll } from "@/services/payroll.service";
import type { SalaryComponent, Payslip, EmployeePayrollRow } from "@/types/payroll";

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

const TAB_OPTIONS = [
  { label: "My Salary", value: "salary" },
  { label: "Company Payroll", value: "company" },
];

export default function PayrollPage() {
  const { showToast } = useToast();
  const { can } = useRBAC();

  const [components, setComponents] = useState<SalaryComponent[] | null>(null);
  const [payslips, setPayslips] = useState<Payslip[] | null>(null);
  const [companyRows, setCompanyRows] = useState<EmployeePayrollRow[] | null>(null);
  const [tab, setTab] = useState("salary");

  const canViewCompany = can("payroll", "approve");

  useEffect(() => {
    let isMounted = true;
    getMySalaryComponents().then((data) => isMounted && setComponents(data));
    getMyPayslips().then((data) => isMounted && setPayslips(data));
    if (canViewCompany) {
      getCompanyPayroll().then((data) => isMounted && setCompanyRows(data));
    }
    return () => {
      isMounted = false;
    };
  }, [canViewCompany]);

  const earnings = useMemo(() => (components ?? []).filter((c) => c.type === "earning"), [components]);
  const deductions = useMemo(() => (components ?? []).filter((c) => c.type === "deduction"), [components]);
  const grossTotal = earnings.reduce((sum, c) => sum + c.amount, 0);
  const deductionsTotal = deductions.reduce((sum, c) => sum + c.amount, 0);
  const netPay = grossTotal - deductionsTotal;

  const tabOptions = canViewCompany ? TAB_OPTIONS : TAB_OPTIONS.slice(0, 1);
  const activeTab = tabOptions.some((option) => option.value === tab) ? tab : tabOptions[0].value;

  return (
    <div>
      <PageHeader title="Payroll" description="Salary structures, processing, and payslips" />

      {!components || !payslips ? (
        <div className="flex items-center justify-center gap-2 py-24 text-muted">
          <Spinner />
          Loading payroll data…
        </div>
      ) : (
        <>
          {tabOptions.length > 1 && (
            <div className="mb-4">
              <Tabs options={tabOptions} value={activeTab} onChange={setTab} />
            </div>
          )}

          {activeTab === "salary" && (
            <>
              <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatCard label="Net Pay (Current Month)" value={formatCurrency(netPay)} icon={Wallet} />
                <StatCard label="Gross Earnings" value={formatCurrency(grossTotal)} icon={TrendingUp} />
                <StatCard label="Total Deductions" value={formatCurrency(deductionsTotal)} icon={TrendingDown} />
              </div>

              <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-border bg-surface-card p-5">
                  <h3 className="mb-3 text-fs-xl font-semibold text-ink">Earnings</h3>
                  <div className="flex flex-col gap-2">
                    {earnings.map((c) => (
                      <div key={c.label} className="flex items-center justify-between text-fs-base">
                        <span className="text-muted">{c.label}</span>
                        <span className="font-medium text-ink">{formatCurrency(c.amount)}</span>
                      </div>
                    ))}
                    <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-fs-base font-semibold text-ink">
                      <span>Gross Total</span>
                      <span>{formatCurrency(grossTotal)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-surface-card p-5">
                  <h3 className="mb-3 text-fs-xl font-semibold text-ink">Deductions</h3>
                  <div className="flex flex-col gap-2">
                    {deductions.map((c) => (
                      <div key={c.label} className="flex items-center justify-between text-fs-base">
                        <span className="text-muted">{c.label}</span>
                        <span className="font-medium text-danger">-{formatCurrency(c.amount)}</span>
                      </div>
                    ))}
                    <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-fs-base font-semibold text-ink">
                      <span>Total Deductions</span>
                      <span>-{formatCurrency(deductionsTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <h3 className="mb-3 text-fs-xl font-semibold text-ink">Payslip History</h3>
              <Table
                columns={[
                  { key: "period", header: "Period", render: (p: Payslip) => <span className="font-medium text-ink">{p.month} {p.year}</span> },
                  { key: "gross", header: "Gross", render: (p: Payslip) => formatCurrency(p.gross) },
                  { key: "deductions", header: "Deductions", render: (p: Payslip) => `-${formatCurrency(p.deductions)}` },
                  { key: "net", header: "Net Pay", render: (p: Payslip) => <span className="font-semibold text-ink">{formatCurrency(p.net)}</span> },
                  { key: "status", header: "Status", render: (p: Payslip) => <StatusBadge status={p.status} /> },
                  {
                    key: "actions",
                    header: "",
                    render: (p: Payslip) =>
                      p.status === "Processed" ? (
                        <Button variant="ghost" size="sm" onClick={() => showToast(`Payslip for ${p.month} ${p.year} downloaded.`)}>
                          <Download className="size-3.5" />
                          Download
                        </Button>
                      ) : (
                        <span className="text-fs-sm text-muted-light">—</span>
                      ),
                  },
                ]}
                data={payslips}
                keyField={(p) => p.id}
              />
            </>
          )}

          {activeTab === "company" && canViewCompany && (
            <>
              {!companyRows ? (
                <div className="flex items-center justify-center gap-2 py-16 text-muted">
                  <Spinner />
                  Loading company payroll…
                </div>
              ) : (
                <Table
                  columns={[
                    {
                      key: "name",
                      header: "Employee",
                      render: (r: EmployeePayrollRow) => (
                        <div>
                          <p className="font-medium text-ink">{r.employeeName}</p>
                          <p className="text-fs-sm text-muted">{r.designation}</p>
                        </div>
                      ),
                    },
                    { key: "gross", header: "Gross", render: (r: EmployeePayrollRow) => formatCurrency(r.gross) },
                    { key: "deductions", header: "Deductions", render: (r: EmployeePayrollRow) => `-${formatCurrency(r.deductions)}` },
                    { key: "net", header: "Net Pay", render: (r: EmployeePayrollRow) => <span className="font-semibold text-ink">{formatCurrency(r.net)}</span> },
                    {
                      key: "status",
                      header: "Status",
                      render: (r: EmployeePayrollRow) => (
                        <div className="flex items-center gap-2">
                          <StatusBadge status={r.status} />
                          {r.status === "Pending" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setCompanyRows((prev) =>
                                  (prev ?? []).map((row) => (row.employeeId === r.employeeId ? { ...row, status: "Processed" } : row))
                                );
                                showToast(`Payroll processed for ${r.employeeName}.`);
                              }}
                            >
                              <PlayCircle className="size-3.5" />
                              Process
                            </Button>
                          )}
                        </div>
                      ),
                    },
                  ]}
                  data={companyRows}
                  keyField={(r) => r.employeeId}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
