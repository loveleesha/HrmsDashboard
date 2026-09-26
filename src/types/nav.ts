import type { LucideIcon } from "lucide-react";
import type { Role } from "./user";
import type { ActionKey, ModuleKey } from "./rbac";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** RBAC module this item is gated by — visible only when can(module, action). */
  module: ModuleKey;
  /** Defaults to "view". Set for an item that's really a shortcut to an
   * action rather than a page to look at — e.g. "Add Employee" links
   * straight into the onboarding wizard, so it should require "add", not
   * just "view" (which every role has on employeeOnboarding by default). */
  action?: ActionKey;
  /** Per-role label overrides, e.g. "Employees" -> "My Team" for a manager. */
  roleLabels?: Partial<Record<Role, string>>;
  /** Nested items, rendered under an expand/collapse toggle instead of a flat link. */
  children?: NavItem[];
}

export interface NavSection {
  label: string;
  items: NavItem[];
}
