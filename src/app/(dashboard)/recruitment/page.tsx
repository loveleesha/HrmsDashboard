"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { Tabs } from "@/components/molecules/Tabs";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { ConfirmModal } from "@/components/molecules/ConfirmModal";
import { RecruitmentSummaryCards } from "@/components/organisms/recruitment/RecruitmentSummaryCards";
import { JobsList } from "@/components/organisms/recruitment/JobsList";
import { AddJobForm, type AddJobFormValues } from "@/components/organisms/recruitment/AddJobForm";
import { AddCandidateForm, type AddCandidateFormValues } from "@/components/organisms/recruitment/AddCandidateForm";
import { CandidatePipeline } from "@/components/organisms/recruitment/CandidatePipeline";
import { CandidateProfileDrawer } from "@/components/organisms/recruitment/CandidateProfileDrawer";
import { ScheduleInterviewModal, type ScheduleInterviewValues } from "@/components/organisms/recruitment/ScheduleInterviewModal";
import { InterviewsList } from "@/components/organisms/recruitment/InterviewsList";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/use-rbac";
import {
  addCandidate,
  createJob,
  deleteJob,
  getRecruitmentStats,
  listCandidates,
  listInterviews,
  listJobs,
  moveCandidateStage,
  scheduleInterview,
  updateJobStatus,
} from "@/services/recruitment.service";
import type { Candidate, Interview, JobPosting, PipelineStage, RecruitmentStats } from "@/types/recruitment";

const TAB_OPTIONS = [
  { label: "Pipeline", value: "pipeline" },
  { label: "Jobs", value: "jobs" },
  { label: "Interviews", value: "interviews" },
];

export default function RecruitmentPage() {
  const { showToast } = useToast();
  const { can } = useRBAC();

  const [jobs, setJobs] = useState<JobPosting[] | null>(null);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [interviews, setInterviews] = useState<Interview[] | null>(null);
  const [stats, setStats] = useState<RecruitmentStats | null>(null);
  const [tab, setTab] = useState("pipeline");
  const [jobFilter, setJobFilter] = useState("");
  const [addJobOpen, setAddJobOpen] = useState(false);
  const [addCandidateOpen, setAddCandidateOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [scheduleFor, setScheduleFor] = useState<Candidate | null>(null);
  const [deleteJobTarget, setDeleteJobTarget] = useState<JobPosting | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canView = can("recruitment", "view");
  const canAdd = can("recruitment", "add");
  const canEdit = can("recruitment", "edit");
  const canDelete = can("recruitment", "delete");
  const canToggleStatus = can("recruitment", "toggleStatus");
  const canApprove = can("recruitment", "approve");
  const canReject = can("recruitment", "reject");

  const load = useCallback(() => {
    Promise.all([listJobs(), listCandidates(), listInterviews(), getRecruitmentStats()]).then(
      ([jobData, candidateData, interviewData, statsData]) => {
        setJobs(jobData);
        setCandidates(candidateData);
        setInterviews(interviewData);
        setStats(statsData);
      }
    );
  }, []);

  useEffect(() => {
    if (canView) load();
  }, [canView, load]);

  const applicantCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (candidates ?? []).forEach((c) => {
      counts[c.jobId] = (counts[c.jobId] ?? 0) + 1;
    });
    return counts;
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    if (!candidates) return [];
    return jobFilter ? candidates.filter((c) => c.jobId === jobFilter) : candidates;
  }, [candidates, jobFilter]);

  async function handleAddJob(values: AddJobFormValues) {
    setIsSubmitting(true);
    try {
      await createJob({
        title: values.title,
        department: values.department,
        jobType: values.type,
        location: values.location,
        experienceRange: values.experience,
        openings: values.openings,
      });
      showToast(`${values.title} posted successfully.`);
      setAddJobOpen(false);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not post this job.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateJobStatus(jobId: string, status: JobPosting["status"]) {
    try {
      await updateJobStatus(jobId, status);
      showToast(`Job marked as ${status}.`);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update this job's status.", "error");
    }
  }

  async function handleDeleteJob() {
    if (!deleteJobTarget) return;
    setIsSubmitting(true);
    try {
      await deleteJob(deleteJobTarget.id);
      showToast(`${deleteJobTarget.title} deleted.`);
      setDeleteJobTarget(null);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not delete this job.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddCandidate(values: AddCandidateFormValues) {
    setIsSubmitting(true);
    try {
      await addCandidate(values);
      showToast(`${values.name} added to the pipeline.`);
      setAddCandidateOpen(false);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not add this candidate.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAdvanceStage(candidateId: string, stage: PipelineStage) {
    try {
      await moveCandidateStage(candidateId, stage);
      setSelectedCandidate((prev) => (prev && prev.id === candidateId ? { ...prev, stage } : prev));
      const candidate = candidates?.find((c) => c.id === candidateId);
      showToast(`${candidate?.name ?? "Candidate"} moved to ${stage}.`);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not move this candidate.", "error");
    }
  }

  async function handleReject(candidateId: string) {
    try {
      await moveCandidateStage(candidateId, "Rejected");
      setSelectedCandidate((prev) => (prev && prev.id === candidateId ? { ...prev, stage: "Rejected" } : prev));
      const candidate = candidates?.find((c) => c.id === candidateId);
      showToast(`${candidate?.name ?? "Candidate"} rejected.`, "info");
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not reject this candidate.", "error");
    }
  }

  async function handleScheduleInterview(values: ScheduleInterviewValues) {
    if (!scheduleFor) return;
    setIsSubmitting(true);
    try {
      const scheduledAt = new Date(`${values.date}T${values.time}`).toISOString();
      await scheduleInterview({ candidateId: scheduleFor.id, scheduledAt, interviewer: values.interviewer });
      showToast("Interview scheduled.");
      setScheduleFor(null);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not schedule this interview.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!canView) {
    return (
      <div>
        <PageHeader title="Recruitment" description="Jobs, candidates, and the hiring pipeline." />
        <p className="py-16 text-center text-fs-base text-muted">You don&apos;t have access to this module.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Recruitment"
        description="Jobs, candidates, and the hiring pipeline."
        actions={
          <>
            {canAdd && (
              <Button variant="secondary" onClick={() => setAddCandidateOpen(true)}>
                <UserPlus className="size-4" />
                Add Candidate
              </Button>
            )}
            {canAdd && (
              <Button onClick={() => setAddJobOpen(true)}>
                <Plus className="size-4" />
                Post Job
              </Button>
            )}
          </>
        }
      />

      {!jobs || !candidates || !interviews || !stats ? (
        <div className="flex items-center justify-center gap-2 py-24 text-muted">
          <Spinner />
          Loading recruitment data…
        </div>
      ) : (
        <>
          <RecruitmentSummaryCards stats={stats} />

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Tabs options={TAB_OPTIONS} value={tab} onChange={setTab} />
            {tab === "pipeline" && (
              <FilterDropdown
                label="All Jobs"
                options={jobs.map((j) => ({ label: j.title, value: j.id }))}
                value={jobFilter}
                onChange={setJobFilter}
                className="w-full sm:w-60"
              />
            )}
          </div>

          {tab === "pipeline" && (
            <CandidatePipeline
              candidates={filteredCandidates}
              canEdit={canEdit}
              canApprove={canApprove}
              canReject={canReject}
              onSelectCandidate={setSelectedCandidate}
              onAdvanceStage={handleAdvanceStage}
              onReject={handleReject}
            />
          )}

          {tab === "jobs" && (
            <JobsList
              jobs={jobs}
              applicantCounts={applicantCounts}
              canToggleStatus={canToggleStatus}
              canDelete={canDelete}
              onUpdateStatus={handleUpdateJobStatus}
              onViewCandidates={(jobId) => {
                setJobFilter(jobId);
                setTab("pipeline");
              }}
              onDelete={setDeleteJobTarget}
            />
          )}

          {tab === "interviews" && <InterviewsList interviews={interviews} />}

          <CandidateProfileDrawer
            candidate={selectedCandidate}
            interviews={interviews}
            canEdit={canEdit}
            canApprove={canApprove}
            canReject={canReject}
            canScheduleInterview={canAdd}
            onClose={() => setSelectedCandidate(null)}
            onAdvanceStage={handleAdvanceStage}
            onReject={handleReject}
            onScheduleInterview={() => setScheduleFor(selectedCandidate)}
          />

          <AddJobForm open={addJobOpen} onClose={() => setAddJobOpen(false)} onSubmit={handleAddJob} isSubmitting={isSubmitting} />
          <AddCandidateForm
            open={addCandidateOpen}
            onClose={() => setAddCandidateOpen(false)}
            onSubmit={handleAddCandidate}
            jobs={jobs}
            isSubmitting={isSubmitting}
          />
          <ScheduleInterviewModal
            open={Boolean(scheduleFor)}
            onClose={() => setScheduleFor(null)}
            candidate={scheduleFor}
            onSubmit={handleScheduleInterview}
            isSubmitting={isSubmitting}
          />
          <ConfirmModal
            open={Boolean(deleteJobTarget)}
            onClose={() => setDeleteJobTarget(null)}
            onConfirm={handleDeleteJob}
            title="Delete this job?"
            description={deleteJobTarget?.title}
            body="This can't be undone."
            confirmLabel="Delete"
            isConfirming={isSubmitting}
          />
        </>
      )}
    </div>
  );
}
