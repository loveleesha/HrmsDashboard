"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, Flag, Loader2, MessageSquare, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { StatCard } from "@/components/molecules/StatCard";
import { Table } from "@/components/molecules/Table";
import { Tabs } from "@/components/molecules/Tabs";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { ActionMenu } from "@/components/molecules/ActionMenu";
import { ConfirmModal } from "@/components/molecules/ConfirmModal";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { TicketForm } from "@/components/organisms/tickets/TicketForm";
import { TicketThreadModal } from "@/components/organisms/tickets/TicketThreadModal";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/use-rbac";
import { createTicket, deleteTicket, listTickets, type TicketScope } from "@/services/ticket.service";
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TICKET_STATUS_LABELS,
  type CreateTicketPayload,
  type Ticket,
  type TicketPriority,
} from "@/types/ticket";

const PRIORITY_TONE: Record<TicketPriority, "danger" | "warning" | "neutral"> = {
  High: "danger",
  Medium: "warning",
  Low: "neutral",
};

const STATUS_OPTIONS = TICKET_STATUSES.map((s) => ({ label: TICKET_STATUS_LABELS[s], value: s }));

export default function TicketsPage() {
  const { showToast } = useToast();
  const { can } = useRBAC();

  const canRaise = can("tickets", "add");
  const canSeeAll = can("supportTickets", "view");
  const canReplyAsAdmin = can("supportTickets", "edit");
  const canDeleteAny = can("supportTickets", "delete");

  const [requestedScope, setScope] = useState<TicketScope>("user");
  const scope: TicketScope = requestedScope === "admin" && canSeeAll ? "admin" : "user";
  const [prevScope, setPrevScope] = useState(scope);
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [openTicketId, setOpenTicketId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ticket | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (scope !== prevScope) {
    setPrevScope(scope);
    setTickets(null);
    setLoadError(null);
  }

  useEffect(() => {
    let isMounted = true;
    listTickets(scope)
      .then((data) => {
        if (isMounted) setTickets(data);
      })
      .catch((err) => {
        if (isMounted) setLoadError(err instanceof Error ? err.message : "Could not load tickets.");
      });
    return () => {
      isMounted = false;
    };
  }, [scope]);

  const visibleTickets = useMemo(
    () =>
      (tickets ?? []).filter(
        (t) => (!status || t.status === status) && (!priority || t.priority === priority) && (!category || t.category === category)
      ),
    [tickets, status, priority, category]
  );

  const counts = useMemo(() => {
    const list = tickets ?? [];
    return {
      total: list.length,
      open: list.filter((t) => t.status === "open").length,
      inProgress: list.filter((t) => t.status === "in_progress").length,
      resolved: list.filter((t) => t.status === "resolved" || t.status === "closed").length,
    };
  }, [tickets]);

  async function handleCreate(payload: CreateTicketPayload): Promise<boolean> {
    setIsCreating(true);
    try {
      const created = await createTicket(payload);
      showToast(created.code ? `Ticket ${created.code} created.` : "Ticket created.");
      setFormOpen(false);
      if (scope === "user") {
        const fresh = await listTickets("user");
        setTickets(fresh);
      } else {
        setScope("user");
      }
      return true;
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not create this ticket.", "error");
      return false;
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteTicket(deleteTarget.id);
      setTickets((prev) => (prev ?? []).filter((t) => t.id !== deleteTarget.id));
      showToast("Ticket deleted.", "info");
      setDeleteTarget(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not delete this ticket.", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  function handleTicketChanged(updated: Ticket) {
    setTickets((prev) => (prev ?? []).map((t) => (t.id === updated.id ? { ...t, ...updated, employeeName: updated.employeeName ?? t.employeeName } : t)));
  }

  const isAdminScope = scope === "admin";

  return (
    <div>
      <PageHeader
        title={isAdminScope ? "All Tickets" : "My Tickets"}
        description={
          isAdminScope ? "Every employee's support requests — reply, resolve, or remove." : "Raise and track your support requests with the HR team."
        }
        actions={
          canRaise ? (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="size-4" />
              New Ticket
            </Button>
          ) : undefined
        }
      />

      {canSeeAll && (
        <div className="mb-4">
          <Tabs
            options={[
              { label: "My Tickets", value: "user" },
              { label: "All Tickets", value: "admin" },
            ]}
            value={scope}
            onChange={(value) => setScope(value as TicketScope)}
          />
        </div>
      )}

      {loadError ? (
        <p className="rounded-xl border border-dashed border-border bg-surface-card px-6 py-16 text-center text-fs-base text-danger">
          {loadError}
        </p>
      ) : !tickets ? (
        <div className="flex items-center justify-center gap-2 py-24 text-muted">
          <Spinner />
          Loading tickets…
        </div>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Total" value={String(counts.total)} icon={MessageSquare} />
            <StatCard label="Open" value={String(counts.open)} icon={Flag} />
            <StatCard label="In Progress" value={String(counts.inProgress)} icon={Loader2} />
            <StatCard label="Resolved" value={String(counts.resolved)} icon={CheckCircle2} />
          </div>

          <div className="mb-4 flex flex-col gap-2 rounded-xl border border-border bg-surface-card p-4 sm:flex-row sm:flex-wrap sm:items-center">
            <FilterDropdown label="All statuses" options={STATUS_OPTIONS} value={status} onChange={setStatus} className="w-full sm:w-40" />
            <FilterDropdown
              label="All priorities"
              options={TICKET_PRIORITIES.map((p) => ({ label: p, value: p }))}
              value={priority}
              onChange={setPriority}
              className="w-full sm:w-40"
            />
            <FilterDropdown
              label="All categories"
              options={TICKET_CATEGORIES.map((c) => ({ label: c, value: c }))}
              value={category}
              onChange={setCategory}
              className="w-full sm:w-40"
            />
          </div>

          <Table
            columns={[
              ...(tickets.some((t) => t.code)
                ? [{ key: "code", header: "Ticket", render: (t: Ticket) => <span className="font-mono text-fs-sm text-ink">{t.code ?? "—"}</span> }]
                : []),
              {
                key: "subject",
                header: "Subject",
                render: (t: Ticket) => (
                  <button type="button" onClick={() => setOpenTicketId(t.id)} className="text-left font-medium text-ink hover:text-primary hover:underline">
                    {t.subject}
                  </button>
                ),
              },
              ...(isAdminScope ? [{ key: "employee", header: "Employee", render: (t: Ticket) => t.employeeName ?? "—" }] : []),
              { key: "category", header: "Category", render: (t: Ticket) => t.category || "—" },
              { key: "priority", header: "Priority", render: (t: Ticket) => <Badge tone={PRIORITY_TONE[t.priority]}>{t.priority}</Badge> },
              { key: "status", header: "Status", render: (t: Ticket) => <StatusBadge status={TICKET_STATUS_LABELS[t.status] ?? t.status} /> },
              {
                key: "date",
                header: "Raised",
                render: (t: Ticket) =>
                  t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—",
              },
              {
                key: "actions",
                header: "",
                headerClassName: "w-10",
                className: "text-right",
                render: (t: Ticket) => (
                  <div className="flex justify-end">
                    <ActionMenu
                      ariaLabel={`Actions for ${t.subject}`}
                      items={[
                        { label: "View Conversation", icon: Eye, onClick: () => setOpenTicketId(t.id) },
                        {
                          label: "Delete",
                          icon: Trash2,
                          tone: "danger",
                          onClick: () => setDeleteTarget(t),
                          hidden: !(isAdminScope && canDeleteAny),
                        },
                      ]}
                    />
                  </div>
                ),
              },
            ]}
            data={visibleTickets}
            keyField={(t) => t.id}
            emptyMessage={tickets.length === 0 ? "No support tickets yet." : "No tickets match these filters."}
          />
        </>
      )}

      <TicketForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleCreate} isSubmitting={isCreating} />

      {openTicketId && (
        <TicketThreadModal
          key={`${scope}-${openTicketId}`}
          scope={scope}
          ticketId={openTicketId}
          onClose={() => setOpenTicketId(null)}
          onChanged={handleTicketChanged}
          canReply={isAdminScope ? canReplyAsAdmin : canRaise}
          canChangeStatus={isAdminScope && canReplyAsAdmin}
        />
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirmed}
        title="Delete Ticket"
        description={deleteTarget?.subject}
        body="This permanently removes the ticket and its whole conversation."
        confirmLabel="Delete Ticket"
        isConfirming={isDeleting}
      />
    </div>
  );
}
