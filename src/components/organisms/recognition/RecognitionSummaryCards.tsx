import { Send, Inbox, Award, CalendarDays } from "lucide-react";
import { StatCard } from "@/components/molecules/StatCard";
import type { RecognitionSummary } from "@/types/recognition";

export function RecognitionSummaryCards({ summary }: { summary: RecognitionSummary }) {
  return (
    <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Recognitions Given" value={String(summary.given)} icon={Send} />
      <StatCard label="Recognitions Received" value={String(summary.received)} icon={Inbox} />
      <StatCard label="Badges Earned" value={String(summary.badgesEarned)} icon={Award} />
      <StatCard label="This Month" value={String(summary.thisMonth)} icon={CalendarDays} />
    </div>
  );
}
