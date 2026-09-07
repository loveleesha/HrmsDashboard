import type { Candidate, Interview, JobPosting, PipelineStage } from "@/types/recruitment";

/**
 * Mock recruitment/ATS service. Replace the bodies of these functions with
 * real API calls once the Node.js backend exists — callers only depend on
 * the exported function signatures.
 */

export const MOCK_JOBS: JobPosting[] = [
  {
    id: "JOB-101",
    title: "Senior Backend Engineer",
    department: "Engineering",
    location: "Bangalore",
    type: "Full-time",
    status: "Open",
    openings: 2,
    experience: "5-8 years",
    postedOn: "2026-08-10",
  },
  {
    id: "JOB-102",
    title: "Product Designer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    status: "Open",
    openings: 1,
    experience: "3-5 years",
    postedOn: "2026-08-15",
  },
  {
    id: "JOB-103",
    title: "HR Business Partner",
    department: "HR",
    location: "Delhi",
    type: "Full-time",
    status: "On Hold",
    openings: 1,
    experience: "4-6 years",
    postedOn: "2026-07-20",
  },
  {
    id: "JOB-104",
    title: "Sales Development Representative",
    department: "Sales",
    location: "Mumbai",
    type: "Full-time",
    status: "Open",
    openings: 3,
    experience: "1-3 years",
    postedOn: "2026-08-25",
  },
  {
    id: "JOB-105",
    title: "Marketing Intern",
    department: "Marketing",
    location: "Bangalore",
    type: "Internship",
    status: "Open",
    openings: 2,
    experience: "0-1 years",
    postedOn: "2026-09-01",
  },
  {
    id: "JOB-106",
    title: "DevOps Engineer",
    department: "Engineering",
    location: "Pune",
    type: "Full-time",
    status: "Open",
    openings: 1,
    experience: "4-7 years",
    postedOn: "2026-08-05",
  },
  {
    id: "JOB-107",
    title: "Financial Analyst",
    department: "Finance",
    location: "Mumbai",
    type: "Full-time",
    status: "Closed",
    openings: 1,
    experience: "2-4 years",
    postedOn: "2026-06-15",
  },
  {
    id: "JOB-108",
    title: "Operations Executive",
    department: "Operations",
    location: "Delhi",
    type: "Contract",
    status: "Open",
    openings: 2,
    experience: "1-2 years",
    postedOn: "2026-08-28",
  },
];

function job(id: string) {
  return MOCK_JOBS.find((j) => j.id === id)!;
}

export const MOCK_CANDIDATES: Candidate[] = [
  { id: "CND-01", name: "Nikhil Bansal", email: "nikhil.bansal@mail.com", phone: "+91 90011 22334", jobId: "JOB-101", jobTitle: job("JOB-101").title, stage: "Interview", appliedOn: "2026-08-20", experience: "6 years", skills: ["Node.js", "PostgreSQL", "AWS"], rating: 4, source: "LinkedIn" },
  { id: "CND-02", name: "Ritika Sharma", email: "ritika.sharma@mail.com", phone: "+91 90012 22335", jobId: "JOB-101", jobTitle: job("JOB-101").title, stage: "Offer", appliedOn: "2026-08-14", experience: "7 years", skills: ["Java", "Spring Boot", "Kafka"], rating: 5, source: "Referral" },
  { id: "CND-03", name: "Amitabh Joshi", email: "amitabh.joshi@mail.com", phone: "+91 90013 22336", jobId: "JOB-101", jobTitle: job("JOB-101").title, stage: "Screening", appliedOn: "2026-08-28", experience: "5 years", skills: ["Node.js", "MongoDB"], rating: 3, source: "Job Board" },
  { id: "CND-04", name: "Sanya Kapoor", email: "sanya.kapoor@mail.com", phone: "+91 90014 22337", jobId: "JOB-101", jobTitle: job("JOB-101").title, stage: "Applied", appliedOn: "2026-09-03", experience: "5 years", skills: ["Go", "PostgreSQL"], rating: 0, source: "LinkedIn" },
  { id: "CND-05", name: "Vivek Rana", email: "vivek.rana@mail.com", phone: "+91 90015 22338", jobId: "JOB-101", jobTitle: job("JOB-101").title, stage: "Rejected", appliedOn: "2026-08-05", experience: "4 years", skills: ["Node.js"], rating: 2, source: "Job Board", notes: "Experience below the required range for this role." },

  { id: "CND-06", name: "Pallavi Deshmukh", email: "pallavi.deshmukh@mail.com", phone: "+91 90016 22339", jobId: "JOB-102", jobTitle: job("JOB-102").title, stage: "Offer", appliedOn: "2026-08-16", experience: "4 years", skills: ["Figma", "Design Systems"], rating: 5, source: "Referral" },
  { id: "CND-07", name: "Rohit Saxena", email: "rohit.saxena@mail.com", phone: "+91 90017 22340", jobId: "JOB-102", jobTitle: job("JOB-102").title, stage: "Interview", appliedOn: "2026-08-22", experience: "3 years", skills: ["Figma", "User Research"], rating: 4, source: "LinkedIn" },
  { id: "CND-08", name: "Meghna Iyer", email: "meghna.iyer@mail.com", phone: "+91 90018 22341", jobId: "JOB-102", jobTitle: job("JOB-102").title, stage: "Applied", appliedOn: "2026-09-02", experience: "3 years", skills: ["Sketch", "Prototyping"], rating: 0, source: "Job Board" },

  { id: "CND-09", name: "Aakash Verma", email: "aakash.verma@mail.com", phone: "+91 90019 22342", jobId: "JOB-104", jobTitle: job("JOB-104").title, stage: "Screening", appliedOn: "2026-08-30", experience: "2 years", skills: ["CRM", "Cold Calling"], rating: 3, source: "Job Board" },
  { id: "CND-10", name: "Divya Nambiar", email: "divya.nambiar@mail.com", phone: "+91 90020 22343", jobId: "JOB-104", jobTitle: job("JOB-104").title, stage: "Interview", appliedOn: "2026-08-27", experience: "3 years", skills: ["B2B Sales", "Negotiation"], rating: 4, source: "Referral" },
  { id: "CND-11", name: "Kunal Chopra", email: "kunal.chopra@mail.com", phone: "+91 90021 22344", jobId: "JOB-104", jobTitle: job("JOB-104").title, stage: "Applied", appliedOn: "2026-09-04", experience: "1 year", skills: ["Lead Generation"], rating: 0, source: "Job Board" },
  { id: "CND-12", name: "Sana Sheikh", email: "sana.sheikh@mail.com", phone: "+91 90022 22345", jobId: "JOB-104", jobTitle: job("JOB-104").title, stage: "Hired", appliedOn: "2026-08-01", experience: "2 years", skills: ["CRM", "B2B Sales"], rating: 5, source: "Referral" },
  { id: "CND-13", name: "Yashwant Rao", email: "yashwant.rao@mail.com", phone: "+91 90023 22346", jobId: "JOB-104", jobTitle: job("JOB-104").title, stage: "Rejected", appliedOn: "2026-08-10", experience: "1 year", skills: ["Cold Calling"], rating: 2, source: "Job Board", notes: "Did not meet communication skills bar in screening call." },

  { id: "CND-14", name: "Ira Bhatia", email: "ira.bhatia@mail.com", phone: "+91 90024 22347", jobId: "JOB-105", jobTitle: job("JOB-105").title, stage: "Applied", appliedOn: "2026-09-05", experience: "Fresher", skills: ["Content Writing", "SEO"], rating: 0, source: "Campus" },
  { id: "CND-15", name: "Naveen Pillai", email: "naveen.pillai@mail.com", phone: "+91 90025 22348", jobId: "JOB-105", jobTitle: job("JOB-105").title, stage: "Screening", appliedOn: "2026-09-02", experience: "Fresher", skills: ["Social Media", "Canva"], rating: 3, source: "Campus" },
  { id: "CND-16", name: "Ritu Chawla", email: "ritu.chawla@mail.com", phone: "+91 90026 22349", jobId: "JOB-105", jobTitle: job("JOB-105").title, stage: "Hired", appliedOn: "2026-08-20", experience: "Fresher", skills: ["Content Writing"], rating: 4, source: "Campus" },

  { id: "CND-17", name: "Ankit Mishra", email: "ankit.mishra@mail.com", phone: "+91 90027 22350", jobId: "JOB-106", jobTitle: job("JOB-106").title, stage: "Interview", appliedOn: "2026-08-18", experience: "5 years", skills: ["AWS", "Kubernetes", "Terraform"], rating: 4, source: "LinkedIn" },
  { id: "CND-18", name: "Bhavna Suri", email: "bhavna.suri@mail.com", phone: "+91 90028 22351", jobId: "JOB-106", jobTitle: job("JOB-106").title, stage: "Screening", appliedOn: "2026-08-29", experience: "4 years", skills: ["Docker", "CI/CD"], rating: 3, source: "Job Board" },
  { id: "CND-19", name: "Chirag Doshi", email: "chirag.doshi@mail.com", phone: "+91 90029 22352", jobId: "JOB-106", jobTitle: job("JOB-106").title, stage: "Applied", appliedOn: "2026-09-06", experience: "6 years", skills: ["AWS", "Ansible"], rating: 0, source: "Referral" },

  { id: "CND-20", name: "Esha Kulkarni", email: "esha.kulkarni@mail.com", phone: "+91 90030 22353", jobId: "JOB-108", jobTitle: job("JOB-108").title, stage: "Screening", appliedOn: "2026-09-01", experience: "1 year", skills: ["Vendor Coordination"], rating: 3, source: "Job Board" },
  { id: "CND-21", name: "Farhan Ali", email: "farhan.ali@mail.com", phone: "+91 90031 22354", jobId: "JOB-108", jobTitle: job("JOB-108").title, stage: "Applied", appliedOn: "2026-09-05", experience: "2 years", skills: ["Logistics"], rating: 0, source: "Job Board" },
  { id: "CND-22", name: "Gauri Thakur", email: "gauri.thakur@mail.com", phone: "+91 90032 22355", jobId: "JOB-103", jobTitle: job("JOB-103").title, stage: "Interview", appliedOn: "2026-08-12", experience: "5 years", skills: ["Employee Relations", "HRIS"], rating: 4, source: "Referral" },
  { id: "CND-23", name: "Harsh Vardhan", email: "harsh.vardhan@mail.com", phone: "+91 90033 22356", jobId: "JOB-107", jobTitle: job("JOB-107").title, stage: "Hired", appliedOn: "2026-06-25", experience: "3 years", skills: ["Financial Modeling"], rating: 5, source: "Referral" },
  { id: "CND-24", name: "Ishita Sen", email: "ishita.sen@mail.com", phone: "+91 90034 22357", jobId: "JOB-102", jobTitle: job("JOB-102").title, stage: "Rejected", appliedOn: "2026-08-19", experience: "2 years", skills: ["Figma"], rating: 2, source: "Job Board", notes: "Portfolio did not match seniority required for this role." },
];

export const MOCK_INTERVIEWS: Interview[] = [
  { id: "INT-01", candidateId: "CND-01", candidateName: "Nikhil Bansal", jobTitle: job("JOB-101").title, interviewer: "Karan Malhotra", date: "2026-09-09", time: "11:00 AM", mode: "Video", status: "Scheduled", round: "Technical Round 2" },
  { id: "INT-02", candidateId: "CND-02", candidateName: "Ritika Sharma", jobTitle: job("JOB-101").title, interviewer: "Karan Malhotra", date: "2026-09-04", time: "03:00 PM", mode: "Onsite", status: "Completed", round: "Final Round" },
  { id: "INT-03", candidateId: "CND-07", candidateName: "Rohit Saxena", jobTitle: job("JOB-102").title, interviewer: "Diya Patel", date: "2026-09-10", time: "02:30 PM", mode: "Video", status: "Scheduled", round: "Portfolio Review" },
  { id: "INT-04", candidateId: "CND-06", candidateName: "Pallavi Deshmukh", jobTitle: job("JOB-102").title, interviewer: "Diya Patel", date: "2026-09-03", time: "10:00 AM", mode: "Video", status: "Completed", round: "Final Round" },
  { id: "INT-05", candidateId: "CND-10", candidateName: "Divya Nambiar", jobTitle: job("JOB-104").title, interviewer: "Siddharth Rao", date: "2026-09-08", time: "04:00 PM", mode: "Phone", status: "Scheduled", round: "Screening Call" },
  { id: "INT-06", candidateId: "CND-17", candidateName: "Ankit Mishra", jobTitle: job("JOB-106").title, interviewer: "Tanvi Shah", date: "2026-09-11", time: "01:00 PM", mode: "Video", status: "Scheduled", round: "Technical Round 1" },
  { id: "INT-07", candidateId: "CND-22", candidateName: "Gauri Thakur", jobTitle: job("JOB-103").title, interviewer: "Ananya Iyer", date: "2026-09-05", time: "11:30 AM", mode: "Onsite", status: "Completed", round: "HR Round" },
  { id: "INT-08", candidateId: "CND-12", candidateName: "Sana Sheikh", jobTitle: job("JOB-104").title, interviewer: "Siddharth Rao", date: "2026-08-28", time: "12:00 PM", mode: "Onsite", status: "Completed", round: "Final Round" },
];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getJobs(): Promise<JobPosting[]> {
  await delay(200);
  return MOCK_JOBS;
}

export async function getCandidates(): Promise<Candidate[]> {
  await delay(250);
  return MOCK_CANDIDATES;
}

export async function getInterviews(): Promise<Interview[]> {
  await delay(200);
  return MOCK_INTERVIEWS;
}

export function nextStage(stage: PipelineStage): PipelineStage | null {
  const order: PipelineStage[] = ["Applied", "Screening", "Interview", "Offer", "Hired"];
  const index = order.indexOf(stage);
  if (index === -1 || index === order.length - 1) return null;
  return order[index + 1];
}

export function newJobId(): string {
  return `JOB-${Math.floor(200 + Math.random() * 700)}`;
}
