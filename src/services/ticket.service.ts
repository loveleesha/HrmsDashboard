import { httpService } from "@/lib/http/http.service";
import type { CreateTicketPayload, Ticket, TicketFilters, TicketMessage, TicketPriority, TicketStatus } from "@/types/ticket";

/**
 * Support tickets — wired to the real HRMS backend (see the "HRMS API"
 * Postman collection). Two deliberately separate surfaces:
 *  - User > Tickets (/api/user/tickets): self-service, own tickets only
 *    (tickets.view / tickets.add — every role has these by default).
 *  - Admin > Tickets (/api/admin/tickets): every employee's tickets, reply,
 *    resolve, delete — a distinct supportTickets.* permission so a regular
 *    employee's tickets.view can't read anyone else's.
 * The collection doesn't document response bodies beyond `ticket`/`tickets`,
 * so the mappers below check a few plausible field names defensively.
 */

interface RawPerson {
  id?: string;
  _id?: string;
  name?: string;
  role?: string;
}

interface RawMessage {
  id?: string;
  _id?: string;
  message?: string;
  text?: string;
  body?: string;
  sender?: RawPerson | string;
  senderName?: string;
  senderType?: string;
  senderRole?: string;
  isAdmin?: boolean;
  fromAdmin?: boolean;
  createdAt?: string;
}

interface RawTicket {
  id?: string;
  _id?: string;
  ticketId?: string;
  ticketNumber?: string;
  code?: string;
  subject?: string;
  category?: string;
  priority?: string;
  status?: string;
  employee?: RawPerson | string;
  createdBy?: RawPerson | string;
  user?: RawPerson | string;
  employeeName?: string;
  messages?: RawMessage[];
  createdAt?: string;
  resolvedAt?: string;
}

const ADMIN_SENDER_TYPES = new Set(["admin", "hr", "support", "super_admin", "hr_admin", "hr_executive"]);

function personName(value: RawPerson | string | undefined): string | undefined {
  if (!value) return undefined;
  return typeof value === "string" ? undefined : value.name;
}

function normalizePriority(value: string | undefined): TicketPriority {
  const lower = value?.toLowerCase();
  if (lower === "high") return "High";
  if (lower === "low") return "Low";
  return "Medium";
}

function mapMessage(raw: RawMessage, index: number): TicketMessage {
  const senderRole = typeof raw.sender === "object" ? raw.sender?.role : undefined;
  const isAdmin =
    raw.isAdmin ??
    raw.fromAdmin ??
    ADMIN_SENDER_TYPES.has((raw.senderType ?? raw.senderRole ?? senderRole ?? "").toLowerCase());
  return {
    id: raw.id ?? raw._id ?? `msg-${index}`,
    message: raw.message ?? raw.text ?? raw.body ?? "",
    senderName: raw.senderName ?? personName(raw.sender) ?? (isAdmin ? "Support" : "Employee"),
    isAdmin: Boolean(isAdmin),
    createdAt: raw.createdAt,
  };
}

function mapTicket(raw: RawTicket): Ticket {
  return {
    id: raw.id ?? raw._id ?? "",
    code: raw.ticketNumber ?? raw.ticketId ?? raw.code,
    subject: raw.subject ?? "",
    category: raw.category ?? "",
    priority: normalizePriority(raw.priority),
    status: (raw.status as TicketStatus) ?? "open",
    employeeName: raw.employeeName ?? personName(raw.employee) ?? personName(raw.createdBy) ?? personName(raw.user),
    createdAt: raw.createdAt,
    resolvedAt: raw.resolvedAt,
    messages: (raw.messages ?? []).map(mapMessage),
  };
}

function unwrapTicket(data: { ticket?: RawTicket } | RawTicket): RawTicket {
  return "ticket" in data && data.ticket ? data.ticket : (data as RawTicket);
}

function unwrapTickets(data: { tickets?: RawTicket[] } | RawTicket[]): RawTicket[] {
  return Array.isArray(data) ? data : (data.tickets ?? []);
}

function cleanFilters(filters: TicketFilters): Record<string, string> | undefined {
  const entries = Object.entries(filters).filter(([, value]) => Boolean(value)) as [string, string][];
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

export type TicketScope = "user" | "admin";

const BASE: Record<TicketScope, string> = {
  user: "/api/user/tickets",
  admin: "/api/admin/tickets",
};

export async function listTickets(scope: TicketScope, filters: TicketFilters = {}): Promise<Ticket[]> {
  const data = await httpService.get<{ tickets?: RawTicket[] } | RawTicket[]>(BASE[scope], cleanFilters(filters));
  return unwrapTickets(data).map(mapTicket);
}

export async function getTicket(scope: TicketScope, id: string): Promise<Ticket> {
  const data = await httpService.get<{ ticket?: RawTicket } | RawTicket>(`${BASE[scope]}/${id}`);
  return mapTicket(unwrapTicket(data));
}

export async function createTicket(payload: CreateTicketPayload): Promise<Ticket> {
  const data = await httpService.post<{ ticket?: RawTicket } | RawTicket>(BASE.user, payload);
  return mapTicket(unwrapTicket(data));
}

export async function replyToTicket(scope: TicketScope, id: string, message: string): Promise<void> {
  await httpService.post(`${BASE[scope]}/${id}/messages`, { message });
}

export async function updateTicketStatus(id: string, status: TicketStatus): Promise<void> {
  await httpService.patch(`${BASE.admin}/${id}/status`, { status });
}

export async function deleteTicket(id: string): Promise<void> {
  await httpService.delete(`${BASE.admin}/${id}`);
}
