import { Briefcase, Users, CalendarClock, Handshake } from "lucide-react";
import { StatCard } from "@/components/molecules/StatCard";
import type { RecruitmentStats } from "@/types/recruitment";

export function RecruitmentSummaryCards({ stats }: { stats: RecruitmentStats }) {
  return (
    <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Open Positions" value={String(stats.openPositions)} icon={Briefcase} />
      <StatCard label="Total Candidates" value={String(stats.totalCandidates)} icon={Users} />
      <StatCard label="Interviews This Week" value={String(stats.interviewsThisWeek)} icon={CalendarClock} />
      <StatCard label="Offers Extended" value={String(stats.offersExtended)} icon={Handshake} />
    </div>
  );
}
