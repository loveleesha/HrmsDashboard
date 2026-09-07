export type DsrStatus = "Pending" | "Approved" | "Rejected" | "Pending - Short Leave";

export const DSR_STATUSES: DsrStatus[] = ["Pending", "Pending - Short Leave", "Approved", "Rejected"];

export interface DsrEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  email: string;
  employmentType: "Permanent" | "Contract" | "Intern";
  project: string;
  date: string;
  estimatedHours: string;
  noWorkDone: boolean;
  usedAiTools: boolean;
  description: string;
  status: DsrStatus;
}
