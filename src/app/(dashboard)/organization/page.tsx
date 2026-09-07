"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Users, MapPin, Briefcase } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { StatCard } from "@/components/molecules/StatCard";
import { Avatar } from "@/components/atoms/Avatar";
import { Spinner } from "@/components/atoms/Spinner";
import { getEmployees } from "@/services/employee.service";
import { DEPARTMENTS } from "@/types/employee";
import type { Employee } from "@/types/employee";

const DEPARTMENT_ICON_TONE: Record<string, string> = {
  Engineering: "bg-info-bg text-info",
  HR: "bg-success-bg text-success",
  Finance: "bg-warning-bg text-warning",
  Marketing: "bg-primary-soft text-primary",
  Sales: "bg-danger-bg text-danger",
  Operations: "bg-surface text-muted",
};

export default function OrganizationPage() {
  const [employees, setEmployees] = useState<Employee[] | null>(null);

  useEffect(() => {
    let isMounted = true;
    getEmployees().then((data) => {
      if (isMounted) setEmployees(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const cities = useMemo(() => new Set((employees ?? []).map((e) => e.city)), [employees]);

  const departmentSummary = useMemo(() => {
    if (!employees) return [];
    return DEPARTMENTS.map((department) => {
      const members = employees.filter((e) => e.department === department);
      const head = members.find((m) => m.level === "Manager") ?? members[0];
      return { department, members, head };
    });
  }, [employees]);

  return (
    <div>
      <PageHeader title="Organization" description="Company structure, departments, and locations" />

      {!employees ? (
        <div className="flex items-center justify-center gap-2 py-24 text-muted">
          <Spinner />
          Loading organization…
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard label="Total Employees" value={String(employees.length)} icon={Users} />
            <StatCard label="Departments" value={String(DEPARTMENTS.length)} icon={Building2} />
            <StatCard label="Office Locations" value={String(cities.size)} icon={MapPin} />
          </div>

          <div className="mb-4 flex items-center gap-2">
            <Briefcase className="size-4 text-primary" />
            <h2 className="text-fs-xl font-semibold text-ink">Departments</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {departmentSummary.map(({ department, members, head }) => (
              <div key={department} className="flex flex-col gap-3 rounded-xl border border-border bg-surface-card p-4">
                <div className="flex items-center justify-between">
                  <span
                    className={`flex size-10 items-center justify-center rounded-lg ${DEPARTMENT_ICON_TONE[department] ?? "bg-surface text-muted"}`}
                  >
                    <Building2 className="size-5" />
                  </span>
                  <span className="text-fs-sm text-muted">{members.length} members</span>
                </div>
                <div>
                  <p className="text-fs-xl font-semibold text-ink">{department}</p>
                  {head && <p className="text-fs-base text-muted">Led by {head.name}</p>}
                </div>
                {head && (
                  <div className="flex items-center gap-2 border-t border-border pt-3">
                    <Avatar name={head.name} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-fs-base font-medium text-ink">{head.name}</p>
                      <p className="truncate text-fs-sm text-muted">{head.designation}</p>
                    </div>
                  </div>
                )}
                <div className="flex -space-x-2">
                  {members.slice(0, 6).map((member) => (
                    <Avatar key={member.id} name={member.name} size="sm" className="border-2 border-surface-card" />
                  ))}
                  {members.length > 6 && (
                    <span className="flex size-8 items-center justify-center rounded-full border-2 border-surface-card bg-surface text-fs-sm text-muted">
                      +{members.length - 6}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
