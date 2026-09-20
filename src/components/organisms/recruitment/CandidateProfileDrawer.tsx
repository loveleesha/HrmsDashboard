import { Mail, Phone, Briefcase, CalendarDays, ArrowRight, X, CalendarPlus } from "lucide-react";
import { Drawer } from "@/components/molecules/Drawer";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { RatingStars } from "@/components/molecules/RatingStars";
import { nextStage } from "@/services/recruitment.service";
import type { Candidate, Interview, PipelineStage } from "@/types/recruitment";

export interface CandidateProfileDrawerProps {
  candidate: Candidate | null;
  interviews: Interview[];
  canEdit: boolean;
  canApprove: boolean;
  canReject: boolean;
  canScheduleInterview: boolean;
  onClose: () => void;
  onAdvanceStage: (candidateId: string, stage: PipelineStage) => void;
  onReject: (candidateId: string) => void;
  onScheduleInterview: () => void;
}

export function CandidateProfileDrawer({
  candidate,
  interviews,
  canEdit,
  canApprove,
  canReject,
  canScheduleInterview,
  onClose,
  onAdvanceStage,
  onReject,
  onScheduleInterview,
}: CandidateProfileDrawerProps) {
  const target = candidate ? nextStage(candidate.stage) : null;
  const canAdvance = candidate && target && canEdit && (target === "Hired" ? canApprove : true);
  const canRejectCandidate = candidate && canEdit && canReject && candidate.stage !== "Rejected" && candidate.stage !== "Hired";
  const candidateInterviews = candidate ? interviews.filter((i) => i.candidateId === candidate.id) : [];

  return (
    <Drawer open={Boolean(candidate)} onClose={onClose} title="Candidate Profile">
      {candidate && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-2 text-center">
            <Avatar name={candidate.name} size="lg" />
            <div>
              <p className="text-fs-2xl font-semibold text-ink">{candidate.name}</p>
              <p className="text-fs-base text-muted">{candidate.jobTitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={candidate.stage} />
              {candidate.source && <Badge tone="neutral">{candidate.source}</Badge>}
            </div>
            <RatingStars rating={candidate.rating ?? 0} />
          </div>

          <div className="grid grid-cols-1 gap-2 rounded-lg border border-border p-3 text-fs-base sm:grid-cols-2">
            <div className="flex items-center gap-2 text-muted">
              <Mail className="size-4 shrink-0" />
              <span className="truncate">{candidate.email}</span>
            </div>
            <div className="flex items-center gap-2 text-muted">
              <Phone className="size-4 shrink-0" />
              {candidate.phone}
            </div>
            {candidate.experience && (
              <div className="flex items-center gap-2 text-muted">
                <Briefcase className="size-4 shrink-0" />
                {candidate.experience} experience
              </div>
            )}
            <div className="flex items-center gap-2 text-muted">
              <CalendarDays className="size-4 shrink-0" />
              Applied {candidate.appliedOn ? new Date(candidate.appliedOn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
            </div>
          </div>

          {candidate.skills && candidate.skills.length > 0 && (
            <div>
              <p className="mb-2 text-fs-base font-semibold text-ink">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {candidate.skills.map((skill) => (
                  <Badge key={skill} tone="neutral">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {candidate.notes && (
            <div className="rounded-lg bg-surface p-3 text-fs-base text-ink">{candidate.notes}</div>
          )}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-fs-base font-semibold text-ink">Interviews</p>
              {canScheduleInterview && (
                <Button variant="ghost" size="sm" onClick={onScheduleInterview}>
                  <CalendarPlus className="size-3.5" />
                  Schedule
                </Button>
              )}
            </div>
            {candidateInterviews.length === 0 ? (
              <p className="text-fs-base text-muted">No interviews scheduled yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {candidateInterviews.map((interview) => (
                  <div key={interview.id} className="flex items-center justify-between rounded-lg border border-border p-2.5 text-fs-base">
                    <div>
                      <p className="font-medium text-ink">{interview.interviewer}</p>
                      <p className="text-fs-sm text-muted">
                        {new Date(interview.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} ·{" "}
                        {interview.time}
                      </p>
                    </div>
                    <StatusBadge status={interview.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {(canAdvance || canRejectCandidate) && (
            <div className="flex gap-2 border-t border-border pt-4">
              {canAdvance && target && (
                <Button className="flex-1" onClick={() => onAdvanceStage(candidate.id, target)}>
                  <ArrowRight className="size-4" />
                  Move to {target}
                </Button>
              )}
              {canRejectCandidate && (
                <Button variant="secondary" onClick={() => onReject(candidate.id)}>
                  <X className="size-4" />
                  Reject
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}
