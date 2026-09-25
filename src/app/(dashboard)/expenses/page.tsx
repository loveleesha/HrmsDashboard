"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Wallet, Clock, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { StatCard } from "@/components/molecules/StatCard";
import { Table } from "@/components/molecules/Table";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { ActionMenu } from "@/components/molecules/ActionMenu";
import { ConfirmModal } from "@/components/molecules/ConfirmModal";
import { ReasonModal } from "@/components/molecules/ReasonModal";
import { ExpenseForm, type ExpenseFormValues } from "@/components/organisms/expenses/ExpenseForm";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/use-rbac";
import {
  approveExpense,
  deleteAnyExpense,
  deleteMyExpense,
  getMyExpenses,
  listAllExpenses,
  rejectExpense,
  submitExpense,
  updateAnyExpense,
  updateMyExpense,
} from "@/services/expense.service";
import type { Expense } from "@/types/expense";

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function ExpensesPage() {
  const { showToast } = useToast();
  const { can } = useRBAC();

  // Listing everyone's claims (Admin > Expenses) is deliberately not gated
  // on expenses.view — every role gets that by default for the self-service
  // "my expenses" surface instead.
  const canManage = can("expenses", "edit");
  const canAdd = can("expenses", "add");
  const canDeleteAny = can("expenses", "delete");
  const canApprove = can("expenses", "approve");
  const canReject = can("expenses", "reject");
  // A role can have approve/reject without edit (e.g. the default "manager"
  // matrix) — they still need the full list and whose claim it is to act on
  // it, same as someone with edit does.
  const canSeeAll = canManage || canApprove || canReject;

  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Expense | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(() => {
    (canSeeAll ? listAllExpenses() : getMyExpenses()).then(setExpenses);
  }, [canSeeAll]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    const list = expenses ?? [];
    const total = list.reduce((sum, e) => sum + e.amount, 0);
    const pending = list.filter((e) => e.status === "Pending").reduce((sum, e) => sum + e.amount, 0);
    const approved = list.filter((e) => e.status === "Approved" || e.status === "Reimbursed").reduce((sum, e) => sum + e.amount, 0);
    return { total, pending, approved };
  }, [expenses]);

  async function handleSubmit(values: ExpenseFormValues) {
    setIsSubmitting(true);
    try {
      await submitExpense({ category: values.category, amount: values.amount, date: values.spentOn, description: values.description });
      showToast("Expense submitted for approval.");
      setFormOpen(false);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not submit this expense.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEdit(values: ExpenseFormValues) {
    if (!editTarget) return;
    setIsSubmitting(true);
    try {
      const payload = { category: values.category, amount: values.amount, date: values.spentOn, description: values.description };
      if (canManage) {
        await updateAnyExpense(editTarget.id, payload);
      } else {
        await updateMyExpense(editTarget.id, payload);
      }
      showToast("Expense updated.");
      setEditTarget(null);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update this expense.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      if (canManage) {
        await deleteAnyExpense(deleteTarget.id);
      } else {
        await deleteMyExpense(deleteTarget.id);
      }
      showToast("Expense deleted.");
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not delete this expense.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleApprove(expense: Expense) {
    try {
      await approveExpense(expense.id);
      showToast("Expense approved.");
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not approve this expense.", "error");
    }
  }

  async function handleReject(reason: string) {
    if (!rejectTarget) return;
    setIsSubmitting(true);
    try {
      await rejectExpense(rejectTarget.id, reason);
      showToast("Expense rejected.", "info");
      setRejectTarget(null);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not reject this expense.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Expenses"
        description="Submit and track expense reimbursements."
        actions={
          canAdd ? (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="size-4" />
              Log Expense
            </Button>
          ) : undefined
        }
      />

      {expenses === null ? (
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
              ...(canSeeAll ? [{ key: "employee", header: "Employee", render: (e: Expense) => e.employeeName }] : []),
              { key: "category", header: "Category", render: (e: Expense) => e.category },
              { key: "description", header: "Description", render: (e: Expense) => e.description },
              { key: "amount", header: "Amount", render: (e: Expense) => <span className="font-medium text-ink">{formatCurrency(e.amount)}</span> },
              {
                key: "spentOn",
                header: "Date Spent",
                render: (e: Expense) =>
                  e.spentOn ? new Date(e.spentOn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—",
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
                          <Button size="sm" variant="secondary" onClick={() => handleApprove(e)}>
                            Approve
                          </Button>
                        )}
                        {canReject && (
                          <Button size="sm" variant="ghost" onClick={() => setRejectTarget(e)}>
                            Reject
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ),
              },
              {
                key: "actions",
                header: "",
                render: (e: Expense) => {
                  const canEditThis = canManage || (canAdd && e.status === "Pending");
                  const canDeleteThis = canDeleteAny || (canAdd && e.status === "Pending" && !canManage);
                  return (
                    <ActionMenu
                      items={[
                        { label: "Edit", icon: Pencil, onClick: () => setEditTarget(e), hidden: !canEditThis },
                        { label: "Delete", icon: Trash2, onClick: () => setDeleteTarget(e), hidden: !canDeleteThis, tone: "danger" as const },
                      ]}
                    />
                  );
                },
              },
            ]}
            data={expenses}
            keyField={(e) => e.id}
            emptyMessage="No expenses submitted yet."
          />
        </>
      )}

      <ExpenseForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      <ExpenseForm
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEdit}
        isSubmitting={isSubmitting}
        initialValues={
          editTarget
            ? { category: editTarget.category, description: editTarget.description, amount: editTarget.amount, spentOn: editTarget.spentOn }
            : undefined
        }
      />
      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete this expense?"
        description={deleteTarget?.description}
        body="This can't be undone."
        confirmLabel="Delete"
        isConfirming={isSubmitting}
      />
      <ReasonModal
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        onSubmit={handleReject}
        title="Reject expense"
        description={rejectTarget ? `${rejectTarget.employeeName} · ${formatCurrency(rejectTarget.amount)}` : undefined}
        label="Rejection reason"
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
