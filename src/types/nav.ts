import type { LucideIcon } from "lucide-react";
import type { Role } from "./user";
import type { ModuleKey } from "./rbac";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** RBAC module this item is gated by — visible only when can(module, "view"). */
  module: ModuleKey;
  /** Per-role label overrides, e.g. "Employees" -> "My Team" for a manager. */
  roleLabels?: Partial<Record<Role, string>>;
  /** Nested items, rendered under an expand/collapse toggle instead of a flat link. */
  children?: NavItem[];
}

export interface NavSection {
  label: string;
  items: NavItem[];
}
