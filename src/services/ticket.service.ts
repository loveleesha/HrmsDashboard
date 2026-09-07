import type { Ticket } from "@/types/ticket";
import { getEmployeeById } from "@/services/employee.service";

/**
 * Mock support ticket service. Replace the bodies of these functions with
 * real API calls once the Node.js backend exists.
 */

function name(employeeId: string) {
  return getEmployeeById(employeeId)?.name ?? "Unknown";
}

export const MOCK_TICKETS: Ticket[] = [
  {
    id: "TCK-01",
    code: "APP-16062026/0164",
    employeeId: "EMP-1101",
    employeeName: name("EMP-1101"),
    category: "IT Support",
    subject: "Laptop keyboard not working",
    description: "A few keys on my laptop keyboard have stopped responding since yesterday.",
    priority: "High",
    status: "Closed",
    createdOn: "2026-06-16",
  },
  {
    id: "TCK-02",
    code: "APP-30082026/0201",
    employeeId: "EMP-1101",
    employeeName: name("EMP-1101"),
    category: "Payroll",
    subject: "Incorrect tax deduction in August payslip",
    description: "The TDS deducted this month looks higher than the projected amount.",
    priority: "Medium",
    status: "In Progress",
    createdOn: "2026-08-30",
  },
  {
    id: "TCK-03",
    code: "APP-02092026/0209",
    employeeId: "EMP-1204",
    employeeName: name("EMP-1204"),
    category: "HR Query",
    subject: "Need updated offer letter copy",
    description: "Requesting a signed copy of my latest offer letter for a visa application.",
    priority: "Low",
    status: "Open",
    createdOn: "2026-09-02",
  },
  {
    id: "TCK-04",
    code: "APP-05092026/0215",
    employeeId: "EMP-1256",
    employeeName: name("EMP-1256"),
    category: "Facilities",
    subject: "AC not working on 3rd floor",
    description: "The air conditioning near the east wing desks hasn't been cooling since Monday.",
    priority: "Medium",
    status: "Open",
    createdOn: "2026-09-05",
  },
];

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
