import type { LucideIcon } from "lucide-react";

export type ModuleKey =
  | "dashboard"
  | "employees"
  | "employeeOnboarding"
  | "attendance"
  | "leave"
  | "payroll"
  | "recruitment"
  | "performance"
  | "documents"
  | "expenses"
  | "assets"
  | "training"
  | "peerRecognition"
  | "announcements"
  | "organization"
  | "reports"
  | "settings"
  | "roleAccess"
  | "dsr"
  | "projects"
  | "tickets"
  | "holidays";

export type ActionKey =
  | "view"
  | "add"
  | "edit"
  | "delete"
  | "approve"
  | "reject"
  | "export"
  | "toggleStatus"
  | "verifyDocuments"
  | "activate";

export const ACTION_KEYS: ActionKey[] = [
  "view",
  "add",
  "edit",
  "delete",
  "approve",
  "reject",
  "export",
  "toggleStatus",
  "verifyDocuments",
  "activate",
];

export const ACTION_LABELS: Record<ActionKey, string> = {
  view: "View",
  add: "Add",
  edit: "Edit",
  delete: "Delete",
  approve: "Approve",
  reject: "Reject",
  export: "Export",
  toggleStatus: "Activate/Deactivate",
  verifyDocuments: "Verify Documents",
  activate: "Activate Employee",
};

export type ModulePermissions = Partial<Record<ActionKey, boolean>>;

export type RolePermissionMap = Partial<Record<ModuleKey, ModulePermissions>>;

export type PermissionMatrix = Record<string, RolePermissionMap>;

export interface ModuleDef {
  key: ModuleKey;
  label: string;
  icon: LucideIcon;
  actions: ActionKey[];
  group: string;
}
