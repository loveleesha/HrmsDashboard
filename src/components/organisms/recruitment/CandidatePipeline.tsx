import { ArrowRight, X } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { RatingStars } from "@/components/molecules/RatingStars";
import { PIPELINE_STAGES } from "@/types/recruitment";
import type { Candidate, PipelineStage } from "@/types/recruitment";
import { nextStage } from "@/services/recruitment.service";
import { cn } from "@/lib/cn";

const STAGE_ACCENT: Record<PipelineStage, string> = {
  Applied: "border-t-info",
  Screening: "border-t-warning",
  Interview: "border-t-primary",
  Offer: "border-t-success",
  Hired: "border-t-success",
  Rejected: "border-t-danger",
};

export interface CandidatePipelineProps {
  candidates: Candidate[];
  canEdit: boolean;
  canApprove: boolean;
  onSelectCandidate: (candidate: Candidate) => void;
  onAdvanceStage: (candidateId: string, stage: PipelineStage) => void;
  onReject: (candidateId: string) => void;
}

export function CandidatePipeline({
  candidates,
  canEdit,
  canApprove,
  onSelectCandidate,
  onAdvanceStage,
  onReject,
}: CandidatePipelineProps) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid grid-flow-col auto-cols-[260px] gap-3">
        {PIPELINE_STAGES.map((stage) => {
          const stageCandidates = candidates.filter((c) => c.stage === stage);

          return (
            <div key={stage} className={cn("flex flex-col rounded-xl border border-t-4 border-border bg-surface p-3", STAGE_ACCENT[stage])}>
              <div className="mb-3 flex items-center justify-between px-1">
                <h3 className="text-fs-base font-semibold text-ink">{stage}</h3>
                <span className="rounded-full bg-surface-card px-2 py-0.5 text-fs-sm text-muted">
                  {stageCandidates.length}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {stageCandidates.map((candidate) => {
                  const target = nextStage(candidate.stage);
                  const canAdvance = target && (target === "Offer" || target === "Hired" ? canApprove : canEdit);
                  const canRejectCandidate = canEdit && candidate.stage !== "Rejected" && candidate.stage !== "Hired";

                  return (
                    <div
                      key={candidate.id}
                      className="flex flex-col gap-2 rounded-lg border border-border bg-surface-card p-3 text-left"
                    >
                      <button type="button" onClick={() => onSelectCandidate(candidate)} className="flex items-start gap-2 text-left">
                        <Avatar name={candidate.name} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-fs-base font-medium text-ink">{candidate.name}</p>
                          <p className="truncate text-fs-sm text-muted">{candidate.jobTitle}</p>
                        </div>
                      </button>
                      <RatingStars rating={candidate.rating} />
                      <div className="flex flex-wrap gap-1">
                        {candidate.skills.slice(0, 2).map((skill) => (
                          <Badge key={skill} tone="neutral">
                            {skill}
                          </Badge>
                        ))}
                      </div>

                      {(canAdvance || canRejectCandidate) && (
                        <div className="flex gap-1.5 border-t border-border pt-2">
                          {canAdvance && target && (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="flex-1 px-2 text-fs-sm"
                              onClick={() => onAdvanceStage(candidate.id, target)}
                            >
                              <ArrowRight className="size-3" />
                              {target}
                            </Button>
                          )}
                          {canRejectCandidate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="px-2 text-fs-sm text-danger hover:bg-danger-bg"
                              onClick={() => onReject(candidate.id)}
                              aria-label="Reject candidate"
                            >
                              <X className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {stageCandidates.length === 0 && (
                  <p className="px-1 py-4 text-center text-fs-sm text-muted-light">No candidates</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
