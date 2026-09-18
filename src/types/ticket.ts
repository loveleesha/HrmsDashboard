/** The backend's ticket lifecycle: a reply on an "open" ticket auto-flips it to "in_progress";
 * "resolved" stamps resolvedAt/resolvedBy. */
export const TICKET_STATUSES = ["open", "in_progress", "resolved"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number] | "closed";

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

export type TicketPriority = "Low" | "Medium" | "High";
export const TICKET_PRIORITIES: TicketPriority[] = ["Low", "Medium", "High"];

export const TICKET_CATEGORIES = ["IT", "HR", "Payroll", "Facilities", "Other"] as const;

export interface TicketMessage {
  id: string;
  message: string;
  senderName: string;
  /** True for a reply from the support/admin side, false for the employee who raised it. */
  isAdmin: boolean;
  createdAt?: string;
}

export interface Ticket {
  id: string;
  code?: string;
  subject: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  /** Who raised it — only meaningful in the admin list; empty on a user's own tickets. */
  employeeName?: string;
  createdAt?: string;
  resolvedAt?: string;
  messages: TicketMessage[];
}

export interface CreateTicketPayload {
  subject: string;
  category: string;
  priority: TicketPriority;
  message: string;
}

export interface TicketFilters {
  status?: string;
  priority?: string;
  category?: string;
}
