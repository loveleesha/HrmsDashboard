import type { ModuleKey } from "@/types/rbac";

/**
 * Maps a route path to the module(s) that gate it. A route with more than
 * one module (e.g. /organization) is accessible if the account has "view" on
 * ANY of them — that page renders department management inline, gated on
 * its own `departments` permission, but department permissions alone
 * shouldn't be blocked at the door by a route guard that only knew about
 * `organization`. The route guard looks up the longest matching prefix;
 * routes with no entry (e.g. /profile) are not RBAC-gated and always render.
 */
export const ROUTE_MODULE_MAP: Record<string, ModuleKey | ModuleKey[]> = {
  "/dashboard": "dashboard",
  "/employees/onboarding": "employeeOnboarding",
  "/employees": "employees",
  "/attendance": "attendance",
  "/leave": "leave",
  "/payroll": "payroll",
  "/recruitment": "recruitment",
  "/performance": "performance",
  "/training": "training",
  "/documents": "documents",
  "/expenses": "expenses",
  "/assets": "assets",
  "/recognition": "peerRecognition",
  "/announcements": "announcements",
  "/holidays": "holidays",
  "/organization": ["organization", "departments"],
  "/reports": "reports",
  "/settings/roles": "roleAccess",
  "/settings": "settings",
  "/dsr": "dsr",
  "/projects": "projects",
  "/tickets": "tickets",
};

export function resolveRouteModule(pathname: string): ModuleKey[] | null {
  const match = Object.keys(ROUTE_MODULE_MAP)
    .sort((a, b) => b.length - a.length)
    .find((route) => pathname === route || pathname.startsWith(`${route}/`));
  if (!match) return null;
  const entry = ROUTE_MODULE_MAP[match];
  return Array.isArray(entry) ? entry : [entry];
}
