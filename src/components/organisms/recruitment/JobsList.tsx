import { MapPin, Users, Briefcase as BriefcaseIcon, Trash2 } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { ActionMenu } from "@/components/molecules/ActionMenu";
import type { JobPosting } from "@/types/recruitment";

const STATUS_TONE: Record<JobPosting["status"], "success" | "warning" | "neutral"> = {
  Open: "success",
  "On Hold": "warning",
  Closed: "neutral",
};

export interface JobsListProps {
  jobs: JobPosting[];
  applicantCounts: Record<string, number>;
  /** Update Job Status — gated on recruitment.toggleStatus. */
  canToggleStatus: boolean;
  /** Delete Job — gated on recruitment.delete; refused (400 JOB_IN_USE) while it still has candidates. */
  canDelete: boolean;
  onUpdateStatus: (jobId: string, status: JobPosting["status"]) => void;
  onViewCandidates: (jobId: string) => void;
  onDelete: (job: JobPosting) => void;
}

export function JobsList({ jobs, applicantCounts, canToggleStatus, canDelete, onUpdateStatus, onViewCandidates, onDelete }: JobsListProps) {
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface-card px-6 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary">
          <BriefcaseIcon className="size-7" />
        </span>
        <h3 className="text-fs-2xl font-semibold text-ink">No job postings</h3>
        <p className="max-w-sm text-fs-base text-muted">Post a job to start building your candidate pipeline.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {jobs.map((jobPosting) => (
        <div key={jobPosting.id} className="flex flex-col gap-3 rounded-xl border border-border bg-surface-card p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-fs-xl font-semibold text-ink">{jobPosting.title}</p>
              <p className="text-fs-base text-muted">{jobPosting.department}</p>
            </div>
            <div className="flex items-center gap-1">
              <Badge tone={STATUS_TONE[jobPosting.status]}>{jobPosting.status}</Badge>
              {canDelete && (applicantCounts[jobPosting.id] ?? 0) === 0 && (
                <ActionMenu
                  items={[{ label: "Delete Job", icon: Trash2, onClick: () => onDelete(jobPosting), tone: "danger" }]}
                  ariaLabel={`${jobPosting.title} actions`}
                />
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-fs-sm text-muted">
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" />
              {jobPosting.location}
            </span>
            <span>{jobPosting.type}</span>
            <span>{jobPosting.experience}</span>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3 text-fs-base">
            <span className="flex items-center gap-1.5 text-muted">
              <Users className="size-4" />
              {applicantCounts[jobPosting.id] ?? 0} applicants
            </span>
            <span className="text-muted-light">{jobPosting.openings} openings</span>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => onViewCandidates(jobPosting.id)}>
              View Candidates
            </Button>
            {canToggleStatus && jobPosting.status !== "Closed" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onUpdateStatus(jobPosting.id, jobPosting.status === "Open" ? "On Hold" : "Open")}
              >
                {jobPosting.status === "Open" ? "Hold" : "Reopen"}
              </Button>
            )}
            {canToggleStatus && jobPosting.status !== "Closed" && (
              <Button variant="ghost" size="sm" onClick={() => onUpdateStatus(jobPosting.id, "Closed")}>
                Close
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
