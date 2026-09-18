import {
  LayoutDashboard,
  Users,
  UserPlus,
  CalendarCheck,
  CalendarDays,
  Wallet,
  Briefcase,
  Target,
  FileText,
  Receipt,
  Laptop,
  GraduationCap,
  BarChart3,
  Megaphone,
  Building2,
  Settings,
  Award,
  ShieldCheck,
  ClipboardList,
  FolderKanban,
  LifeBuoy,
  PartyPopper,
  Building,
  Headset,
} from "lucide-react";
import type { ModuleDef } from "@/types/rbac";

/**
 * Central catalog of every RBAC-governed module in the app: its label, icon,
 * the actions it supports, and the group it belongs to in the Role & Access
 * matrix. This is the single source other RBAC pieces (permission matrix,
 * sidebar, route guard, role-access page) are generated from.
 */
export const MODULE_DEFS: ModuleDef[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, actions: ["view"], group: "Overview" },
  { key: "employees", label: "Employees", icon: Users, actions: ["view", "add", "edit", "delete", "toggleStatus", "export"], group: "Workforce" },
  {
    key: "employeeOnboarding",
    label: "Employee Onboarding",
    icon: UserPlus,
    actions: ["view", "add", "edit", "delete", "verifyDocuments", "activate"],
    group: "Workforce",
  },
  { key: "attendance", label: "Attendance", icon: CalendarCheck, actions: ["view", "add", "edit", "approve", "export"], group: "Workforce" },
  { key: "leave", label: "Leave", icon: CalendarDays, actions: ["view", "add", "edit", "delete", "approve", "reject", "export"], group: "Workforce" },
  { key: "payroll", label: "Payroll", icon: Wallet, actions: ["view", "add", "edit", "approve", "export"], group: "Workforce" },
  { key: "recruitment", label: "Recruitment", icon: Briefcase, actions: ["view", "add", "edit", "delete", "approve"], group: "Talent" },
  { key: "performance", label: "Performance", icon: Target, actions: ["view", "add", "edit", "approve"], group: "Talent" },
  { key: "training", label: "Training", icon: GraduationCap, actions: ["view", "add", "edit", "delete"], group: "Talent" },
  { key: "dsr", label: "DSR", icon: ClipboardList, actions: ["view", "add", "edit", "approve"], group: "My Workspace" },
  { key: "projects", label: "Projects", icon: FolderKanban, actions: ["view", "add", "edit", "delete"], group: "My Workspace" },
  { key: "tickets", label: "Support Tickets", icon: LifeBuoy, actions: ["view", "add", "edit", "delete"], group: "My Workspace" },
  { key: "documents", label: "Documents", icon: FileText, actions: ["view", "add", "edit", "delete"], group: "Resources" },
  { key: "expenses", label: "Expenses", icon: Receipt, actions: ["view", "add", "edit", "delete", "approve", "reject"], group: "Resources" },
  { key: "assets", label: "Assets", icon: Laptop, actions: ["view", "add", "edit", "toggleStatus"], group: "Resources" },
  { key: "peerRecognition", label: "Peer Recognition", icon: Award, actions: ["view", "add"], group: "Resources" },
  { key: "announcements", label: "Announcements", icon: Megaphone, actions: ["view", "add", "edit", "delete"], group: "Resources" },
  { key: "holidays", label: "Holiday Calendar", icon: PartyPopper, actions: ["view", "add", "edit", "delete"], group: "Resources" },
  { key: "organization", label: "Organization", icon: Building2, actions: ["view", "add", "edit", "delete"], group: "Administration" },
  { key: "supportTickets", label: "Support Tickets (Admin)", icon: Headset, actions: ["view", "edit", "delete"], group: "Administration" },
  { key: "departments", label: "Departments", icon: Building, actions: ["view", "add", "edit", "delete"], group: "Administration" },
  { key: "reports", label: "Reports", icon: BarChart3, actions: ["view", "export"], group: "Administration" },
  { key: "settings", label: "Settings", icon: Settings, actions: ["view", "edit"], group: "Administration" },
  { key: "roleAccess", label: "Role & Access", icon: ShieldCheck, actions: ["view", "edit"], group: "Administration" },
];

export const MODULE_GROUPS = [
  "Overview",
  "Workforce",
  "Talent",
  "My Workspace",
  "Resources",
  "Administration",
] as const;

export function getModuleDef(key: string) {
  return MODULE_DEFS.find((mod) => mod.key === key);
}
