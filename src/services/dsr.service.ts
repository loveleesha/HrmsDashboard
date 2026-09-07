import type { DsrEntry } from "@/types/dsr";
import { getEmployeeById } from "@/services/employee.service";

/**
 * Mock Daily Status Report service. Replace the bodies of these functions
 * with real API calls once the Node.js backend exists.
 */

function forEmployee(employeeId: string) {
  const employee = getEmployeeById(employeeId);
  return {
    employeeId,
    employeeName: employee?.name ?? "Unknown",
    email: employee?.email ?? "",
    employmentType: "Permanent" as const,
  };
}

export const MOCK_DSR_ENTRIES: DsrEntry[] = [
  {
    id: "DSR-9001",
    ...forEmployee("EMP-1101"),
    project: "Hike Portal Revamp",
    date: "2026-09-01",
    estimatedHours: "06:00",
    noWorkDone: false,
    usedAiTools: true,
    description: "Implemented the attendance calendar drawer and wired it to the mock API.",
    status: "Approved",
  },
  {
    id: "DSR-9002",
    ...forEmployee("EMP-1101"),
    project: "Client Onboarding Suite",
    date: "2026-09-01",
    estimatedHours: "02:00",
    noWorkDone: false,
    usedAiTools: false,
    description: "Reviewed onboarding checklist PR comments and pushed fixes.",
    status: "Approved",
  },
  {
    id: "DSR-9003",
    ...forEmployee("EMP-1101"),
    project: "Hike Portal Revamp",
    date: "2026-09-02",
    estimatedHours: "08:00",
    noWorkDone: false,
    usedAiTools: true,
    description: "Built the Leave approvals tab and hooked up approve/reject actions.",
    status: "Approved",
  },
  {
    id: "DSR-9004",
    ...forEmployee("EMP-1101"),
    project: "Hike Portal Revamp",
    date: "2026-09-03",
    estimatedHours: "06:00",
    noWorkDone: false,
    usedAiTools: true,
    description: "Left early for a medical appointment; logged partial hours for the day.",
    status: "Pending - Short Leave",
  },
  {
    id: "DSR-9005",
    ...forEmployee("EMP-1101"),
    project: "Hike Portal Revamp",
    date: "2026-09-04",
    estimatedHours: "05:00",
    noWorkDone: false,
    usedAiTools: false,
    description: "Fixed pagination bug in the recruitment pipeline board.",
    status: "Pending",
  },
  {
    id: "DSR-9006",
    ...forEmployee("EMP-1101"),
    project: "Data Warehouse Migration",
    date: "2026-09-04",
    estimatedHours: "03:00",
    noWorkDone: false,
    usedAiTools: false,
    description: "Paired with the data team on the reporting schema migration plan.",
    status: "Pending",
  },
  {
    id: "DSR-9007",
    ...forEmployee("EMP-1204"),
    project: "Mobile App v2",
    date: "2026-09-04",
    estimatedHours: "08:00",
    noWorkDone: false,
    usedAiTools: false,
    description: "Regression-tested the new attendance module on Android and iOS builds.",
    status: "Pending",
  },
  {
    id: "DSR-9008",
    ...forEmployee("EMP-1256"),
    project: "Client Onboarding Suite",
    date: "2026-09-03",
    estimatedHours: "07:00",
    noWorkDone: false,
    usedAiTools: true,
    description: "Refactored the onboarding wizard's step validation logic.",
    status: "Pending",
  },
];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getDsrEntries(): Promise<DsrEntry[]> {
  await delay(200);
  return [...MOCK_DSR_ENTRIES].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function newDsrId(): string {
  return `DSR-${Math.floor(9100 + Math.random() * 800)}`;
}

export function hoursToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}
