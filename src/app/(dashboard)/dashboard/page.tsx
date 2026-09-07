"use client";

import { useEffect, useState } from "react";
import {
  UserPlus,
  CalendarCheck,
  CalendarDays,
  Briefcase,
  Wallet,
  FileBarChart,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/molecules/PageHeader";
import { buttonVariants } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { DashboardStats } from "@/components/organisms/DashboardStats";
import { EmployeeGrowthChart } from "@/components/organisms/dashboard/EmployeeGrowthChart";
import { AttendanceTrendChart } from "@/components/organisms/dashboard/AttendanceTrendChart";
import { LeaveTrendChart } from "@/components/organisms/dashboard/LeaveTrendChart";
import { DepartmentDistributionChart } from "@/components/organisms/dashboard/DepartmentDistributionChart";
import { TodayAttendanceWidget } from "@/components/organisms/dashboard/TodayAttendanceWidget";
import { BirthdayWidget } from "@/components/organisms/dashboard/BirthdayWidget";
import { NewJoineesWidget } from "@/components/organisms/dashboard/NewJoineesWidget";
import { EventsWidget } from "@/components/organisms/dashboard/EventsWidget";
import { PendingLeaveWidget } from "@/components/organisms/dashboard/PendingLeaveWidget";
import { RecentActivityWidget } from "@/components/organisms/dashboard/RecentActivityWidget";
import { AnnouncementsWidget } from "@/components/organisms/dashboard/AnnouncementsWidget";
import { EmployeeDashboard } from "@/components/organisms/dashboard/EmployeeDashboard";
import { useAuth } from "@/hooks/use-auth";
import { useRBAC } from "@/hooks/use-rbac";
import { getDashboardData } from "@/services/dashboard.service";
import type { DashboardData } from "@/types/dashboard";

const QUICK_ACTIONS = [
  { label: "Add Employee", href: "/employees", icon: UserPlus },
  { label: "Mark Attendance", href: "/attendance", icon: CalendarCheck },
  { label: "Apply Leave", href: "/leave", icon: CalendarDays },
  { label: "Create Job", href: "/recruitment", icon: Briefcase },
  { label: "Run Payroll", href: "/payroll", icon: Wallet },
  { label: "Generate Report", href: "/reports", icon: FileBarChart },
];

const TODAY = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
}).format(new Date());

const SELF_SERVICE_ROLES = new Set(["employee", "special_employee"]);

export default function DashboardPage() {
  const { user } = useAuth();
  const { viewAsRole } = useRBAC();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isSelfServiceView = SELF_SERVICE_ROLES.has(viewAsRole);

  useEffect(() => {
    let isMounted = true;

    getDashboardData()
      .then((result) => {
        if (isMounted) setData(result);
      })
      .catch(() => {
        if (isMounted) setError("Couldn't load dashboard data. Please try again.");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const firstName = user?.name.split(" ")[0] ?? "there";

  if (isSelfServiceView) {
    return <EmployeeDashboard />;
  }

  return (
    <div>
      <PageHeader
        title={`Good day, ${firstName}`}
        description={TODAY}
        actions={QUICK_ACTIONS.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            <action.icon className="size-4" />
            {action.label}
          </Link>
        ))}
      />

      {error && (
        <div className="mb-4 rounded-lg border border-danger-bg bg-danger-bg px-4 py-3 text-fs-base text-danger">
          {error}
        </div>
      )}

      {!data && !error && (
        <div className="flex items-center justify-center gap-2 py-24 text-muted">
          <Spinner />
          Loading dashboard…
        </div>
      )}

      {data && (
        <div className="flex flex-col gap-6">
          <DashboardStats stats={data.stats} />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <EmployeeGrowthChart data={data.employeeGrowth} />
            <AttendanceTrendChart data={data.attendanceTrend} />
            <LeaveTrendChart data={data.leaveTrend} />
            <DepartmentDistributionChart data={data.departmentDistribution} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <TodayAttendanceWidget entries={data.todayAttendance} />
            <BirthdayWidget entries={data.upcomingBirthdays} />
            <NewJoineesWidget entries={data.newJoinees} />
            <EventsWidget entries={data.upcomingEvents} />
            <PendingLeaveWidget entries={data.pendingLeaveRequests} />
            <RecentActivityWidget entries={data.recentActivity} />
            <AnnouncementsWidget entries={data.announcements} />
          </div>
        </div>
      )}
    </div>
  );
}
