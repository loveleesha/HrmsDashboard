"use client";

import { ShieldAlert } from "lucide-react";
import { useRoles } from "@/hooks/use-roles";
import type { Role } from "@/types/user";

export interface AccessRestrictedProps {
  moduleLabel: string;
  role: Role;
}

export function AccessRestricted({ moduleLabel, role }: AccessRestrictedProps) {
  const { getRoleLabel } = useRoles();

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface-card px-6 py-20 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-danger-bg text-danger">
        <ShieldAlert className="size-7" />
      </span>
      <h2 className="text-fs-4xl font-semibold text-ink">Access Restricted</h2>
      <p className="max-w-md text-fs-lg text-muted">
        The <span className="font-medium text-ink">{getRoleLabel(role)}</span> role does not have
        permission to view <span className="font-medium text-ink">{moduleLabel}</span>.
      </p>
      <p className="text-fs-sm text-muted-light">
        Contact an administrator in Settings &gt; Role &amp; Access if you believe this is incorrect.
      </p>
    </div>
  );
}
