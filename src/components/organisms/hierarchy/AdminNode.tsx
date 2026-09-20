import { ShieldCheck } from "lucide-react";
import type { HierarchySummary } from "@/types/hierarchy";

export function AdminNode({ summary, onOpenDetails }: { summary: HierarchySummary; onOpenDetails?: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpenDetails}
      className="flex w-64 flex-col gap-2 rounded-xl border-2 border-primary bg-primary-soft p-4 text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
          <ShieldCheck className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-fs-lg font-semibold text-ink">Admin</p>
          <p className="truncate text-fs-sm text-muted">Administrator</p>
        </div>
      </div>
      <div className="border-t border-primary/20 pt-2 text-fs-sm text-muted">
        <p>
          {summary.totalProjects} Projects · {summary.totalManagers} Managers
        </p>
        <p>{summary.totalEmployees} Employees</p>
      </div>
    </button>
  );
}
