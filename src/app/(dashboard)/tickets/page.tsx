"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, MessageSquare, Flag, Loader2, CheckCircle2, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { StatCard } from "@/components/molecules/StatCard";
import { Table } from "@/components/molecules/Table";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { TicketForm, type TicketFormValues } from "@/components/organisms/tickets/TicketForm";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/use-rbac";
import { getTickets, newTicketCode, newTicketId } from "@/services/ticket.service";
import { getEmployees } from "@/services/employee.service";
import type { Ticket, TicketPriority } from "@/types/ticket";
import type { Employee } from "@/types/employee";

const PRIORITY_TONE: Record<TicketPriority, "danger" | "warning" | "neutral"> = {
  High: "danger",
  Medium: "warning",
  Low: "neutral",
};

export default function TicketsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { can } = useRBAC();

  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const canDelete = can("tickets", "delete");
  const canManageAll = can("tickets", "edit");

  useEffect(() => {
    let isMounted = true;
    Promise.all([getTickets(), getEmployees()]).then(([ticketData, employeeData]) => {
      if (!isMounted) return;
      setTickets(ticketData);
      setEmployees(employeeData);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const currentEmployee = employees?.find((e) => e.email === user?.email) ?? employees?.[0] ?? null;

  const visibleTickets = useMemo(() => {
    if (!tickets || !currentEmployee) return [];
    return canManageAll ? tickets : tickets.filter((t) => t.employeeId === currentEmployee.id);
  }, [tickets, currentEmployee, canManageAll]);

  const counts = useMemo(
    () => ({
      total: visibleTickets.length,
      open: visibleTickets.filter((t) => t.status === "Open").length,
      inProgress: visibleTickets.filter((t) => t.status === "In Progress").length,
      closed: visibleTickets.filter((t) => t.status === "Closed").length,
    }),
    [visibleTickets]
  );

  function handleSubmit(values: TicketFormValues) {
    if (!currentEmployee) return;
    const newTicket: Ticket = {
      id: newTicketId(),
      code: newTicketCode(),
      employeeId: currentEmployee.id,
      employeeName: currentEmployee.name,
      category: values.category,
      subject: values.subject,
      description: values.description,
      priority: values.priority,
      status: "Open",
      createdOn: new Date().toISOString().slice(0, 10),
    };
    setTickets((prev) => [newTicket, ...(prev ?? [])]);
    setFormOpen(false);
    showToast(`Ticket ${newTicket.code} created.`);
  }

  function handleDelete(id: string) {
    setTickets((prev) => (prev ?? []).filter((t) => t.id !== id));
    showToast("Ticket deleted.", "info");
  }

  return (
    <div>
      <PageHeader
        title="My Tickets"
        description="Raise and track your support requests with the HR team."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="size-4" />
            New Ticket
          </Button>
        }
      />

      {!tickets || !currentEmployee ? (
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
            <StatCard label="Closed" value={String(counts.closed)} icon={CheckCircle2} />
          </div>

          <Table
            columns={[
              { key: "code", header: "Ticket Code", render: (t: Ticket) => <span className="font-mono text-fs-sm text-ink">{t.code}</span> },
              {
                key: "priority",
                header: "Priority",
                render: (t: Ticket) => <Badge tone={PRIORITY_TONE[t.priority]}>{t.priority}</Badge>,
              },
              { key: "employee", header: "Employee", render: (t: Ticket) => t.employeeName },
              { key: "subject", header: "Subject", render: (t: Ticket) => t.subject },
              { key: "status", header: "Status", render: (t: Ticket) => <StatusBadge status={t.status} /> },
              {
                key: "date",
                header: "Date",
                render: (t: Ticket) =>
                  new Date(t.createdOn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
              },
              ...(canDelete
                ? [
                    {
                      key: "actions",
                      header: "",
                      render: (t: Ticket) => (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-danger hover:bg-danger-bg"
                          onClick={() => handleDelete(t.id)}
                          aria-label="Delete ticket"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      ),
                    },
                  ]
                : []),
            ]}
            data={visibleTickets}
            keyField={(t) => t.id}
            emptyMessage="No support tickets yet."
          />
        </>
      )}

      <TicketForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} />
    </div>
  );
}
