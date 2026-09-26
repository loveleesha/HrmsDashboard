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
  LayoutGrid,
  PartyPopper,
  Network,
} from "lucide-react";
import type { NavSection } from "@/types/nav";

/**
 * The single canonical navigation list the sidebar is generated from.
 * Visibility is decided by RBAC (`can(module, "view")`), never hard-coded
 * per role; `roleLabels` lets the same item read differently for different
 * roles (e.g. a manager's "Employees" becomes "My Team") without forking
 * the list itself.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, module: "dashboard" }],
  },
  {
    label: "Workforce",
    items: [
      {
        label: "Employees",
        href: "/employees",
        icon: Users,
        module: "employees",
        roleLabels: { manager: "My Team" },
        children: [
          { label: "Directory", href: "/employees", icon: Users, module: "employees" },
          { label: "Onboarding", href: "/employees/onboarding", icon: UserPlus, module: "employeeOnboarding" },
          {
            label: "Add Employee",
            href: "/employees/onboarding/new",
            icon: UserPlus,
            module: "employeeOnboarding",
            action: "add",
          },
        ],
      },
      {
        label: "Projects",
        href: "/projects",
        icon: FolderKanban,
        module: "projects",
        children: [
          { label: "Overview", href: "/projects", icon: FolderKanban, module: "projects" },
          { label: "Team Hierarchy", href: "/projects/hierarchy", icon: Network, module: "projects" },
        ],
      },
      { label: "Attendance", href: "/attendance", icon: CalendarCheck, module: "attendance" },
      {
        label: "Leave",
        href: "/leave",
        icon: CalendarDays,
        module: "leave",
        roleLabels: { manager: "Leave Approvals", hr_admin: "Leave Approvals", hr_executive: "Leave Approvals" },
      },
      { label: "Payroll", href: "/payroll", icon: Wallet, module: "payroll" },
    ],
  },
  {
    label: "Talent",
    items: [
      { label: "Recruitment", href: "/recruitment", icon: Briefcase, module: "recruitment" },
      { label: "Performance", href: "/performance", icon: Target, module: "performance" },
      { label: "Training", href: "/training", icon: GraduationCap, module: "training" },
    ],
  },
  {
    label: "My Workspace",
    items: [
      {
        label: "My Workspace",
        href: "/dsr",
        icon: LayoutGrid,
        module: "dsr",
        children: [
          { label: "DSR", href: "/dsr", icon: ClipboardList, module: "dsr" },
          { label: "Support Tickets", href: "/tickets", icon: LifeBuoy, module: "tickets" },
          { label: "My Leave", href: "/leave", icon: CalendarDays, module: "leave" },
          { label: "Holiday Calendar", href: "/holidays", icon: PartyPopper, module: "holidays" },
        ],
      },
    ],
  },
  {
    label: "Resources",
    items: [
      { label: "Documents", href: "/documents", icon: FileText, module: "documents" },
      { label: "Expenses", href: "/expenses", icon: Receipt, module: "expenses" },
      { label: "Assets", href: "/assets", icon: Laptop, module: "assets" },
      { label: "Peer Recognition", href: "/recognition", icon: Award, module: "peerRecognition" },
      { label: "Announcements", href: "/announcements", icon: Megaphone, module: "announcements" },
      { label: "Holiday Calendar", href: "/holidays", icon: PartyPopper, module: "holidays" },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Organization", href: "/organization", icon: Building2, module: "organization" },
      { label: "Reports", href: "/reports", icon: BarChart3, module: "reports" },
      { label: "Settings", href: "/settings", icon: Settings, module: "settings" },
      { label: "Role & Access", href: "/settings/roles", icon: ShieldCheck, module: "roleAccess" },
    ],
  },
];
