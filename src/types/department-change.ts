export type DepartmentChangeStatus = "Pending" | "Approved" | "Rejected";

export interface DepartmentChangeRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  currentDepartment: string;
  requestedDepartment: string;
  reason: string;
  status: DepartmentChangeStatus;
  requestedOn: string;
}
