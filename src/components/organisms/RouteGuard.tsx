"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useRBAC } from "@/hooks/use-rbac";
import { getModuleDef } from "@/lib/rbac/modules";
import { resolveRouteModule } from "@/lib/rbac/route-modules";
import { AccessRestricted } from "@/components/templates/AccessRestricted";

export function RouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { can, viewAsRole } = useRBAC();

  const moduleKey = resolveRouteModule(pathname);

  if (moduleKey && !can(moduleKey, "view")) {
    const moduleDef = getModuleDef(moduleKey);
    return <AccessRestricted moduleLabel={moduleDef?.label ?? moduleKey} role={viewAsRole} />;
  }

  return <>{children}</>;
}
