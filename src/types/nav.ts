import type { LucideIcon } from "lucide-react";
import type { Role } from "./user";
import type { ActionKey, ModuleKey } from "./rbac";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** RBAC module(s) this item is gated by — visible when can(module, action)
   * for ANY of them (an array covers a page that renders more than one
   * permission's content, like Organization also rendering department
   * management inline under its own `departments` permission). */
  module: ModuleKey | ModuleKey[];
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
