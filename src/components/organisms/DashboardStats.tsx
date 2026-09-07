import {
  Users,
  UserCheck,
  UserMinus,
  UserPlus,
  ClipboardList,
  Briefcase,
  Wallet,
} from "lucide-react";
import { StatCard } from "@/components/molecules/StatCard";
import type { DashboardStat } from "@/types/dashboard";

const ICON_BY_LABEL: Record<string, typeof Users> = {
  "Total Employees": Users,
  "Present Today": UserCheck,
  "On Leave": UserMinus,
  "New Employees": UserPlus,
  "Pending Approvals": ClipboardList,
  "Open Positions": Briefcase,
  "Payroll Summary": Wallet,
};

export interface DashboardStatsProps {
  stats: DashboardStat[];
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} icon={ICON_BY_LABEL[stat.label]} />
      ))}
    </div>
  );
}
