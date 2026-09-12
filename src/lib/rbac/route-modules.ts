import type { ModuleKey } from "@/types/rbac";

/**
 * Maps a route path to the module that gates it. The route guard looks up
 * the longest matching prefix; routes with no entry (e.g. /profile) are not
 * RBAC-gated and always render.
 */
export const ROUTE_MODULE_MAP: Record<string, ModuleKey> = {
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
  "/organization": "organization",
  "/reports": "reports",
  "/settings/roles": "roleAccess",
  "/settings": "settings",
  "/dsr": "dsr",
  "/projects": "projects",
  "/tickets": "tickets",
};

export function resolveRouteModule(pathname: string): ModuleKey | null {
  const match = Object.keys(ROUTE_MODULE_MAP)
    .sort((a, b) => b.length - a.length)
    .find((route) => pathname === route || pathname.startsWith(`${route}/`));
  return match ? ROUTE_MODULE_MAP[match] : null;
}
