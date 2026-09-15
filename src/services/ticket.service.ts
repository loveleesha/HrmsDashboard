import type { Ticket } from "@/types/ticket";

/**
 * Mock support ticket service. Replace the bodies of these functions with
 * real API calls once the Node.js backend exists.
 */

export const MOCK_TICKETS: Ticket[] = [];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getTickets(): Promise<Ticket[]> {
  await delay(200);
  return [...MOCK_TICKETS].sort((a, b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime());
}

export function newTicketCode(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const seq = Math.floor(1000 + Math.random() * 8999);
  return `APP-${day}${month}${now.getFullYear()}/${seq}`;
}

export function newTicketId(): string {
  return `TCK-${Math.floor(100 + Math.random() * 800)}`;
}
