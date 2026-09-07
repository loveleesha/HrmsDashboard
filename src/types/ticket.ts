export type TicketStatus = "Open" | "In Progress" | "Closed";
export type TicketPriority = "Low" | "Medium" | "High";

export const TICKET_PRIORITIES: TicketPriority[] = ["Low", "Medium", "High"];
export const TICKET_CATEGORIES = ["IT Support", "HR Query", "Payroll", "Facilities", "Other"] as const;
export type TicketCategory = (typeof TICKET_CATEGORIES)[number];

export interface Ticket {
  id: string;
  code: string;
  employeeId: string;
  employeeName: string;
  category: TicketCategory;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdOn: string;
}
