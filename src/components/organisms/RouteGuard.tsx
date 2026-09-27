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

  const moduleKeys = resolveRouteModule(pathname);

  if (moduleKeys && !moduleKeys.some((key) => can(key, "view"))) {
    const moduleDef = getModuleDef(moduleKeys[0]);
    return <AccessRestricted moduleLabel={moduleDef?.label ?? moduleKeys[0]} role={viewAsRole} />;
  }

  return <>{children}</>;
}
