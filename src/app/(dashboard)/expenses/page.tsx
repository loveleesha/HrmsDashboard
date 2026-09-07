"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Wallet, Clock, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { StatCard } from "@/components/molecules/StatCard";
import { Table } from "@/components/molecules/Table";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { ExpenseForm, type ExpenseFormValues } from "@/components/organisms/expenses/ExpenseForm";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/use-rbac";
import { getExpenses, newExpenseId } from "@/services/expense.service";
import { getEmployees } from "@/services/employee.service";
import type { Expense } from "@/types/expense";
import type { Employee } from "@/types/employee";

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function ExpensesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { can } = useRBAC();

  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const canApprove = can("expenses", "approve");
  const canReject = can("expenses", "reject");

  useEffect(() => {
    let isMounted = true;
    Promise.all([getExpenses(), getEmployees()]).then(([expenseData, employeeData]) => {
      if (!isMounted) return;
      setExpenses(expenseData);
      setEmployees(employeeData);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const currentEmployee = employees?.find((e) => e.email === user?.email) ?? employees?.[0] ?? null;

  const visibleExpenses = useMemo(() => {
    if (!expenses || !currentEmployee) return [];
    return canApprove || canReject ? expenses : expenses.filter((e) => e.employeeId === currentEmployee.id);
  }, [expenses, currentEmployee, canApprove, canReject]);

  const summary = useMemo(() => {
    const total = visibleExpenses.reduce((sum, e) => sum + e.amount, 0);
    const pending = visibleExpenses.filter((e) => e.status === "Pending").reduce((sum, e) => sum + e.amount, 0);
    const approved = visibleExpenses.filter((e) => e.status === "Approved" || e.status === "Reimbursed").reduce((sum, e) => sum + e.amount, 0);
    return { total, pending, approved };
  }, [visibleExpenses]);

  function handleSubmit(values: ExpenseFormValues) {
    if (!currentEmployee) return;
    const newExpense: Expense = {
      id: newExpenseId(),
      employeeId: currentEmployee.id,
      employeeName: currentEmployee.name,
      category: values.category,
      description: values.description,
      amount: values.amount,
      spentOn: values.spentOn,
      submittedOn: new Date().toISOString().slice(0, 10),
      status: "Pending",
    };
    setExpenses((prev) => [newExpense, ...(prev ?? [])]);
    setFormOpen(false);
    showToast("Expense submitted for approval.");
  }

  function updateStatus(id: string, status: Expense["status"]) {
    setExpenses((prev) => (prev ?? []).map((e) => (e.id === id ? { ...e, status } : e)));
    showToast(status === "Approved" ? "Expense approved." : "Expense rejected.", status === "Approved" ? "success" : "info");
  }

  return (
    <div>
      <PageHeader
        title="Expenses"
        description="Submit and track expense reimbursements."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="size-4" />
            Log Expense
          </Button>
        }
      />

      {!expenses || !currentEmployee ? (
        <div className="flex items-center justify-center gap-2 py-24 text-muted">
          <Spinner />
          Loading expenses…
        </div>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard label="Total Submitted" value={formatCurrency(summary.total)} icon={Wallet} />
            <StatCard label="Pending Approval" value={formatCurrency(summary.pending)} icon={Clock} />
            <StatCard label="Approved / Reimbursed" value={formatCurrency(summary.approved)} icon={CheckCircle2} />
          </div>

          <Table
            columns={[
              { key: "employee", header: "Employee", render: (e: Expense) => e.employeeName },
              { key: "category", header: "Category", render: (e: Expense) => e.category },
              { key: "description", header: "Description", render: (e: Expense) => e.description },
              { key: "amount", header: "Amount", render: (e: Expense) => <span className="font-medium text-ink">{formatCurrency(e.amount)}</span> },
              {
                key: "spentOn",
                header: "Date Spent",
                render: (e: Expense) => new Date(e.spentOn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
              },
              {
                key: "status",
                header: "Status",
                render: (e: Expense) => (
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={e.status} />
                    {e.status === "Pending" && (canApprove || canReject) && (
                      <div className="flex gap-1">
                        {canApprove && (
                          <Button size="sm" variant="secondary" onClick={() => updateStatus(e.id, "Approved")}>
                            Approve
                          </Button>
                        )}
                        {canReject && (
                          <Button size="sm" variant="ghost" onClick={() => updateStatus(e.id, "Rejected")}>
                            Reject
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ),
              },
            ]}
            data={visibleExpenses}
            keyField={(e) => e.id}
            emptyMessage="No expenses submitted yet."
          />
        </>
      )}

      <ExpenseForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} />
    </div>
  );
}
