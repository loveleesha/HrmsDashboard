"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { Tabs } from "@/components/molecules/Tabs";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { RecruitmentSummaryCards } from "@/components/organisms/recruitment/RecruitmentSummaryCards";
import { JobsList } from "@/components/organisms/recruitment/JobsList";
import { AddJobForm, type AddJobFormValues } from "@/components/organisms/recruitment/AddJobForm";
import { CandidatePipeline } from "@/components/organisms/recruitment/CandidatePipeline";
import { CandidateProfileDrawer } from "@/components/organisms/recruitment/CandidateProfileDrawer";
import { InterviewsList } from "@/components/organisms/recruitment/InterviewsList";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/use-rbac";
import { getJobs, getCandidates, getInterviews, newJobId } from "@/services/recruitment.service";
import type { Candidate, Interview, JobPosting, PipelineStage } from "@/types/recruitment";

const TODAY = new Date();

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
  const [tab, setTab] = useState("pipeline");
  const [jobFilter, setJobFilter] = useState("");
  const [addJobOpen, setAddJobOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const canAdd = can("recruitment", "add");
  const canEdit = can("recruitment", "edit");
  const canDelete = can("recruitment", "delete");
  const canApprove = can("recruitment", "approve");

  useEffect(() => {
    let isMounted = true;
    Promise.all([getJobs(), getCandidates(), getInterviews()]).then(([jobData, candidateData, interviewData]) => {
      if (!isMounted) return;
      setJobs(jobData);
      setCandidates(candidateData);
      setInterviews(interviewData);
    });
    return () => {
      isMounted = false;
    };
  }, []);

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

  function handleAddJob(values: AddJobFormValues) {
    const newJob: JobPosting = {
      id: newJobId(),
      title: values.title,
      department: values.department,
      location: values.location,
      type: values.type,
      status: "Open",
      openings: values.openings,
      experience: values.experience,
      postedOn: TODAY.toISOString().slice(0, 10),
    };
    setJobs((prev) => [newJob, ...(prev ?? [])]);
    setAddJobOpen(false);
    showToast(`${newJob.title} posted successfully.`);
  }

  function handleUpdateJobStatus(jobId: string, status: JobPosting["status"]) {
    setJobs((prev) => (prev ?? []).map((j) => (j.id === jobId ? { ...j, status } : j)));
    const job = jobs?.find((j) => j.id === jobId);
    showToast(`${job?.title ?? "Job"} marked as ${status}.`);
  }

  function handleAdvanceStage(candidateId: string, stage: PipelineStage) {
    setCandidates((prev) => (prev ?? []).map((c) => (c.id === candidateId ? { ...c, stage } : c)));
    setSelectedCandidate((prev) => (prev && prev.id === candidateId ? { ...prev, stage } : prev));
    const candidate = candidates?.find((c) => c.id === candidateId);
    showToast(`${candidate?.name ?? "Candidate"} moved to ${stage}.`);
  }

  function handleReject(candidateId: string) {
    setCandidates((prev) => (prev ?? []).map((c) => (c.id === candidateId ? { ...c, stage: "Rejected" } : c)));
    setSelectedCandidate((prev) => (prev && prev.id === candidateId ? { ...prev, stage: "Rejected" } : prev));
    const candidate = candidates?.find((c) => c.id === candidateId);
    showToast(`${candidate?.name ?? "Candidate"} rejected.`, "info");
  }

  return (
    <div>
      <PageHeader
        title="Recruitment"
        description="Jobs, candidates, and the hiring pipeline."
        actions={
          canAdd ? (
            <Button onClick={() => setAddJobOpen(true)}>
              <Plus className="size-4" />
              Post Job
            </Button>
          ) : undefined
        }
      />

      {!jobs || !candidates || !interviews ? (
        <div className="flex items-center justify-center gap-2 py-24 text-muted">
          <Spinner />
          Loading recruitment data…
        </div>
      ) : (
        <>
          <RecruitmentSummaryCards jobs={jobs} candidates={candidates} interviews={interviews} today={TODAY} />

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
              onSelectCandidate={setSelectedCandidate}
              onAdvanceStage={handleAdvanceStage}
              onReject={handleReject}
            />
          )}

          {tab === "jobs" && (
            <JobsList
              jobs={jobs}
              applicantCounts={applicantCounts}
              canEdit={canEdit}
              canDelete={canDelete}
              onUpdateStatus={handleUpdateJobStatus}
              onViewCandidates={(jobId) => {
                setJobFilter(jobId);
                setTab("pipeline");
              }}
            />
          )}

          {tab === "interviews" && <InterviewsList interviews={interviews} />}

          <CandidateProfileDrawer
            candidate={selectedCandidate}
            interviews={interviews}
            canEdit={canEdit}
            canApprove={canApprove}
            onClose={() => setSelectedCandidate(null)}
            onAdvanceStage={handleAdvanceStage}
            onReject={handleReject}
          />

          <AddJobForm open={addJobOpen} onClose={() => setAddJobOpen(false)} onSubmit={handleAddJob} />
        </>
      )}
    </div>
  );
}
