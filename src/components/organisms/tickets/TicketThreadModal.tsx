"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Modal } from "@/components/molecules/Modal";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { Textarea } from "@/components/atoms/Textarea";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { Spinner } from "@/components/atoms/Spinner";
import { useToast } from "@/hooks/use-toast";
import { getTicket, replyToTicket, updateTicketStatus, type TicketScope } from "@/services/ticket.service";
import { TICKET_STATUSES, TICKET_STATUS_LABELS, type Ticket, type TicketStatus } from "@/types/ticket";
import { cn } from "@/lib/cn";

export interface TicketThreadModalProps {
  scope: TicketScope;
  ticketId: string;
  onClose: () => void;
  /** Called whenever a reply/status change refreshes the ticket, so the list behind can stay in sync. */
  onChanged: (ticket: Ticket) => void;
  canReply: boolean;
  /** Admin scope only — resolve/reopen. */
  canChangeStatus?: boolean;
}

const STATUS_OPTIONS = TICKET_STATUSES.map((status) => ({ label: TICKET_STATUS_LABELS[status], value: status }));

/** Mounted fresh per opened ticket (the parent renders it conditionally), so it loads once on mount. */
export function TicketThreadModal({ scope, ticketId, onClose, onChanged, canReply, canChangeStatus }: TicketThreadModalProps) {
  const { showToast } = useToast();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    getTicket(scope, ticketId)
      .then((data) => {
        if (isMounted) setTicket(data);
      })
      .catch((err) => {
        if (isMounted) setLoadError(err instanceof Error ? err.message : "Could not load this ticket.");
      });
    return () => {
      isMounted = false;
    };
  }, [scope, ticketId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [ticket?.messages.length]);

  async function refresh() {
    const data = await getTicket(scope, ticketId);
    setTicket(data);
    onChanged(data);
  }

  async function handleSend() {
    if (!reply.trim()) return;
    setIsSending(true);
    try {
      await replyToTicket(scope, ticketId, reply.trim());
      setReply("");
      await refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not send your reply.", "error");
    } finally {
      setIsSending(false);
    }
  }

  async function handleStatusChange(next: string) {
    if (!next || next === ticket?.status) return;
    setIsUpdatingStatus(true);
    try {
      await updateTicketStatus(ticketId, next as TicketStatus);
      await refresh();
      showToast(`Ticket marked ${TICKET_STATUS_LABELS[next as TicketStatus].toLowerCase()}.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update the ticket status.", "error");
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={ticket?.subject ?? "Ticket"}
      description={ticket ? [ticket.code, ticket.employeeName].filter(Boolean).join(" · ") || undefined : undefined}
      widthClassName="sm:max-w-2xl"
      footer={
        canReply ? (
          <div className="flex items-end gap-2">
            <Textarea
              rows={2}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Write a reply…"
              aria-label="Reply"
              className="flex-1"
              disabled={!ticket}
            />
            <Button onClick={handleSend} isLoading={isSending} disabled={!ticket || !reply.trim()}>
              <Send className="size-4" />
              Send
            </Button>
          </div>
        ) : undefined
      }
    >
      {loadError ? (
        <p className="py-8 text-center text-fs-base text-danger">{loadError}</p>
      ) : !ticket ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted">
          <Spinner />
          Loading conversation…
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={TICKET_STATUS_LABELS[ticket.status] ?? ticket.status} />
            <Badge tone={ticket.priority === "High" ? "danger" : ticket.priority === "Medium" ? "warning" : "neutral"}>
              {ticket.priority}
            </Badge>
            {ticket.category && <Badge tone="neutral">{ticket.category}</Badge>}
            {canChangeStatus && (
              <div className={cn("ml-auto w-40", isUpdatingStatus && "pointer-events-none opacity-60")}>
                <FilterDropdown label="Status" ariaLabel="Ticket status" options={STATUS_OPTIONS} value={ticket.status} onChange={handleStatusChange} />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {ticket.messages.length === 0 && <p className="text-fs-base text-muted">No messages yet.</p>}
            {ticket.messages.map((m) => (
              <div key={m.id} className={cn("flex", m.isAdmin ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-xl px-3 py-2",
                    m.isAdmin ? "bg-primary-soft text-ink" : "bg-surface text-ink"
                  )}
                >
                  <p className="mb-0.5 text-fs-sm font-medium text-muted">
                    {m.senderName}
                    {m.isAdmin && " · Support"}
                  </p>
                  <p className="whitespace-pre-wrap text-fs-base">{m.message}</p>
                  {m.createdAt && (
                    <p className="mt-1 text-fs-sm text-muted-light">
                      {new Date(m.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
        </div>
      )}
    </Modal>
  );
}
