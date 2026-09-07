"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Briefcase, Award, Megaphone, ArrowRight } from "lucide-react";
import { StatusDot } from "@/components/atoms/StatusDot";
import { Badge } from "@/components/atoms/Badge";
import { buttonVariants } from "@/components/atoms/Button";
import { Avatar } from "@/components/atoms/Avatar";
import { Spinner } from "@/components/atoms/Spinner";
import { NewJoineesWidget } from "@/components/organisms/dashboard/NewJoineesWidget";
import { EventsWidget } from "@/components/organisms/dashboard/EventsWidget";
import { useAuth } from "@/hooks/use-auth";
import { getEmployees } from "@/services/employee.service";
import { getAttendanceMonth } from "@/services/attendance.service";
import { getJobs } from "@/services/recruitment.service";
import { getRecognitions, buildSummary } from "@/services/recognition.service";
import { getAnnouncements } from "@/services/announcement.service";
import { getDashboardData } from "@/services/dashboard.service";
import type { Employee } from "@/types/employee";
import type { AttendanceDay } from "@/types/attendance";
import type { JobPosting } from "@/types/recruitment";
import type { Announcement } from "@/types/announcement";
import type { RecognitionSummary } from "@/types/recognition";
import type { EventEntry, NewJoineeEntry } from "@/types/dashboard";

const TODAY = new Date();

function greeting() {
  const hour = TODAY.getHours();
  if (hour < 12) return "Good Morning!";
  if (hour < 17) return "Good Afternoon!";
  return "Good Evening!";
}

const TODAY_LABEL = TODAY.toLocaleDateString("en-IN", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function EmployeeDashboard() {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceDay | null>(null);
  const [jobs, setJobs] = useState<JobPosting[] | null>(null);
  const [recognitionSummary, setRecognitionSummary] = useState<RecognitionSummary | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);
  const [newJoinees, setNewJoinees] = useState<NewJoineeEntry[] | null>(null);
  const [events, setEvents] = useState<EventEntry[] | null>(null);

  useEffect(() => {
    let isMounted = true;

    getEmployees().then((employees) => {
      if (!isMounted) return;
      const me = employees.find((e) => e.email === user?.email) ?? employees[0] ?? null;
      setEmployee(me);
      if (me) {
        const days = getAttendanceMonth(me.id, TODAY.getFullYear(), TODAY.getMonth(), TODAY);
        setTodayAttendance(days[days.length - 1] ?? null);
      }
    });
    getJobs().then((data) => isMounted && setJobs(data.filter((j) => j.status === "Open")));
    getRecognitions().then((data) => isMounted && setRecognitionSummary(buildSummary(data, user?.employeeId)));
    getAnnouncements().then((data) => isMounted && setAnnouncements(data.slice(0, 3)));
    getDashboardData().then((data) => {
      if (!isMounted) return;
      setNewJoinees(data.newJoinees);
      setEvents(data.upcomingEvents);
    });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const openJob = useMemo(() => jobs?.[0] ?? null, [jobs]);

  if (!employee) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted">
        <Spinner />
        Loading your dashboard…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={employee.name} size="lg" />
          <div>
            <p className="text-fs-lg text-muted">{greeting()}</p>
            <p className="text-fs-3xl font-semibold text-ink">{employee.name}</p>
            <p className="text-fs-base text-muted">
              {TODAY_LABEL} · {employee.designation}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-surface-card p-4 sm:grid-cols-3 lg:grid-cols-6">
        <div>
          <span className="flex items-center gap-1.5 text-fs-sm text-muted-light">
            <StatusDot tone="success" />
            Check In
          </span>
          <p className="mt-1 text-fs-xl font-semibold text-ink">{todayAttendance?.punchIn ?? "--"}</p>
        </div>
        <div>
          <span className="flex items-center gap-1.5 text-fs-sm text-muted-light">
            <StatusDot tone={todayAttendance?.punchOut ? "neutral" : "info"} />
            Check Out
          </span>
          <p className="mt-1 text-fs-xl font-semibold text-ink">
            {todayAttendance?.punchOut ?? (todayAttendance?.punchIn ? "Still in office" : "--")}
          </p>
        </div>
        <div>
          <span className="text-fs-sm text-muted-light">Work Hours</span>
          <p className="mt-1 text-fs-xl font-semibold text-ink">{todayAttendance?.workingHours ?? "No data today"}</p>
        </div>
        <div>
          <span className="text-fs-sm text-muted-light">Punches</span>
          <p className="mt-1 text-fs-xl font-semibold text-ink">{todayAttendance?.punchIn ? 1 : 0}</p>
        </div>
        <div className="col-span-2">
          <span className="text-fs-sm text-muted-light">Shift & Work Mode</span>
          <p className="mt-1 text-fs-lg font-semibold text-ink">{todayAttendance?.shift ?? "09:00 AM – 06:00 PM"}</p>
        </div>
        <div className="col-span-2 flex items-end sm:col-span-3 lg:col-span-1">
          <Link href="/attendance" className={buttonVariants({ variant: "secondary", size: "sm" })}>
            <CalendarDays className="size-4" />
            View Calendar
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-fs-lg font-semibold text-ink">
              <Briefcase className="size-4 text-primary" />
              Latest Job Openings
            </h3>
            <Link href="/recruitment" className="text-fs-sm text-primary hover:underline">
              View All
            </Link>
          </div>
          {openJob ? (
            <div className="flex flex-col gap-2">
              <p className="text-fs-lg font-semibold text-ink">{openJob.title}</p>
              <p className="text-fs-sm text-muted">
                {openJob.department} · {openJob.location}
              </p>
              <div className="flex items-center justify-between text-fs-sm text-muted">
                <span>{openJob.openings} openings</span>
                <span>{openJob.experience}</span>
              </div>
              <Link href="/recruitment" className={buttonVariants({ variant: "secondary", size: "sm" })}>
                View Details
              </Link>
            </div>
          ) : (
            <p className="text-fs-base text-muted">No open positions right now.</p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-fs-lg font-semibold text-ink">
              <Award className="size-4 text-primary" />
              Peer Recognition
            </h3>
            <Link href="/recognition" className="text-fs-sm text-primary hover:underline">
              Give Now
            </Link>
          </div>
          {recognitionSummary ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-info-bg p-3 text-center">
                <p className="text-fs-4xl font-bold text-info">{recognitionSummary.received}</p>
                <p className="text-fs-sm text-muted">Received</p>
              </div>
              <div className="rounded-lg bg-success-bg p-3 text-center">
                <p className="text-fs-4xl font-bold text-success">{recognitionSummary.given}</p>
                <p className="text-fs-sm text-muted">Given</p>
              </div>
              <div className="rounded-lg bg-primary-soft p-3 text-center">
                <p className="text-fs-4xl font-bold text-primary">{recognitionSummary.badgesEarned}</p>
                <p className="text-fs-sm text-muted">Badges</p>
              </div>
              <div className="rounded-lg bg-warning-bg p-3 text-center">
                <p className="text-fs-4xl font-bold text-warning">{recognitionSummary.thisMonth}</p>
                <p className="text-fs-sm text-muted">This Month</p>
              </div>
            </div>
          ) : (
            <Spinner />
          )}
        </div>

        <NewJoineesWidget entries={newJoinees ?? []} />
      </div>

      <EventsWidget entries={events ?? []} />

      <div className="rounded-xl border border-border bg-surface-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-fs-lg font-semibold text-ink">
            <Megaphone className="size-4 text-primary" />
            Latest at Hike Associate
          </h3>
          <Link href="/announcements" className="flex items-center gap-1 text-fs-sm text-primary hover:underline">
            View More
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
        {announcements ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="rounded-lg border border-border p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="truncate text-fs-base font-semibold text-ink">{announcement.title}</p>
                  {announcement.priority === "High" && <Badge tone="danger">High</Badge>}
                </div>
                <p className="line-clamp-3 text-fs-sm text-muted">{announcement.body}</p>
                <p className="mt-2 text-fs-sm text-muted-light">{announcement.postedBy}</p>
              </div>
            ))}
          </div>
        ) : (
          <Spinner />
        )}
      </div>
    </div>
  );
}
