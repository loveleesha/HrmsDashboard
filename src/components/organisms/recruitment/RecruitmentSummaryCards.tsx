import { Briefcase, Users, CalendarClock, Handshake } from "lucide-react";
import { StatCard } from "@/components/molecules/StatCard";
import type { Candidate, Interview, JobPosting } from "@/types/recruitment";

function isThisWeek(dateStr: string, today: Date) {
  const date = new Date(dateStr);
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return date >= start && date <= end;
}

export function RecruitmentSummaryCards({
  jobs,
  candidates,
  interviews,
  today,
}: {
  jobs: JobPosting[];
  candidates: Candidate[];
  interviews: Interview[];
  today: Date;
}) {
  const openPositions = jobs.filter((j) => j.status === "Open").reduce((sum, j) => sum + j.openings, 0);
  const interviewsThisWeek = interviews.filter(
    (interview) => interview.status === "Scheduled" && isThisWeek(interview.date, today)
  ).length;
  const offersExtended = candidates.filter((c) => c.stage === "Offer" || c.stage === "Hired").length;

  return (
    <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Open Positions" value={String(openPositions)} icon={Briefcase} />
      <StatCard label="Total Candidates" value={String(candidates.length)} icon={Users} />
      <StatCard label="Interviews This Week" value={String(interviewsThisWeek)} icon={CalendarClock} />
      <StatCard label="Offers Extended" value={String(offersExtended)} icon={Handshake} />
    </div>
  );
}
