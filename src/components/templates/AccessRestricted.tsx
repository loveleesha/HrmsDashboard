import { ShieldAlert } from "lucide-react";
import { ROLE_LABELS } from "@/types/user";
import type { Role } from "@/types/user";

export interface AccessRestrictedProps {
  moduleLabel: string;
  role: Role;
}

export function AccessRestricted({ moduleLabel, role }: AccessRestrictedProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface-card px-6 py-20 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-danger-bg text-danger">
        <ShieldAlert className="size-7" />
      </span>
      <h2 className="text-fs-4xl font-semibold text-ink">Access Restricted</h2>
      <p className="max-w-md text-fs-lg text-muted">
        The <span className="font-medium text-ink">{ROLE_LABELS[role]}</span> role does not have
        permission to view <span className="font-medium text-ink">{moduleLabel}</span>.
      </p>
      <p className="text-fs-sm text-muted-light">
        Switch to a role with access using the &ldquo;View As&rdquo; selector in the header.
      </p>
    </div>
  );
}
