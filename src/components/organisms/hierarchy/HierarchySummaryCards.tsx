import { FolderKanban, Users, UserCog, CheckCircle2 } from "lucide-react";
import { StatCard } from "@/components/molecules/StatCard";
import type { HierarchySummary } from "@/types/hierarchy";

export function HierarchySummaryCards({ summary }: { summary: HierarchySummary }) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Projects" value={String(summary.totalProjects)} icon={FolderKanban} />
      <StatCard label="Managers" value={String(summary.totalManagers)} icon={UserCog} />
      <StatCard label="Employees" value={String(summary.totalEmployees)} icon={Users} />
      <StatCard label="Active Projects" value={String(summary.activeProjects)} icon={CheckCircle2} />
    </div>
  );
}
