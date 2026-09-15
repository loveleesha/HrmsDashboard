"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { Spinner } from "@/components/atoms/Spinner";
import { AttendanceSummaryCards } from "@/components/organisms/attendance/AttendanceSummaryCards";
import { AttendanceCalendar } from "@/components/organisms/attendance/AttendanceCalendar";
import { AttendanceDetailsPanel } from "@/components/organisms/attendance/AttendanceDetailsPanel";
import { AttendanceLegend } from "@/components/organisms/attendance/AttendanceLegend";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/use-rbac";
import { getEmployees } from "@/services/employee.service";
import {
  getAttendanceMonth,
  getAttendanceSummary,
  punchOutToday,
} from "@/services/attendance.service";
import { toDateKey } from "@/lib/attendance-utils";
import { DEPARTMENTS } from "@/types/employee";
import type { Employee } from "@/types/employee";
import type { AttendanceDay } from "@/types/attendance";

const TODAY = new Date();

export default function AttendancePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { can } = useRBAC();
  const canViewTeam = can("employees", "view");

  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [department, setDepartment] = useState("");
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [year, setYear] = useState(TODAY.getFullYear());
  const [month, setMonth] = useState(TODAY.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [override, setOverride] = useState<Record<string, AttendanceDay>>({});

  useEffect(() => {
    let isMounted = true;
    getEmployees().then((result) => {
      if (!isMounted) return;
      setEmployees(result);
      const defaultEmployee =
        result.find((employee) => employee.email === user?.email) ?? result[0];
      setEmployeeId(defaultEmployee?.id ?? null);
    });
    return () => {
      isMounted = false;
    };
  }, [user]);

  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    return department ? employees.filter((e) => e.department === department) : employees;
  }, [employees, department]);

  const selectedEmployee = employees?.find((employee) => employee.id === employeeId) ?? null;

  const days = useMemo(() => {
    if (!employeeId) return [];
    const generated = getAttendanceMonth(employeeId, year, month);
    return generated.map((day) => override[day.date] ?? day);
  }, [employeeId, year, month, override]);

  const summary = useMemo(() => getAttendanceSummary(days), [days]);

  const todayKey = toDateKey(TODAY);
  const selectedDay = days.find((day) => day.date === selectedDateKey) ?? null;

  function goToMonth(offset: number) {
    const next = new Date(year, month + offset, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  }

  function handleClockOut() {
    if (!selectedDateKey || !selectedDay) return;
    const updated = punchOutToday(selectedDay);
    setOverride((prev) => ({ ...prev, [selectedDateKey]: updated }));
    showToast("Clocked out successfully. Have a great evening!");
  }

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Track attendance, working hours and daily activity."
      />

      {!employees || !employeeId ? (
        <div className="flex items-center justify-center gap-2 py-24 text-muted">
          <Spinner />
          Loading attendance…
        </div>
      ) : (
        <>
          {canViewTeam && (
            <div className="mb-4 flex flex-wrap gap-2">
              <FilterDropdown
                label="Department"
                options={DEPARTMENTS.map((d) => ({ label: d, value: d }))}
                value={department}
                onChange={(value) => {
                  setDepartment(value);
                  const nextList = value
                    ? employees.filter((e) => e.department === value)
                    : employees;
                  setEmployeeId(nextList[0]?.id ?? null);
                }}
                className="w-full sm:w-48"
              />
              <FilterDropdown
                label="Employee"
                options={filteredEmployees.map((e) => ({ label: e.name, value: e.id }))}
                value={employeeId ?? ""}
                onChange={setEmployeeId}
                className="w-full sm:w-56"
              />
            </div>
          )}

          <AttendanceSummaryCards summary={summary} />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[7fr_3fr]">
            <div className="flex flex-col gap-4">
              <AttendanceCalendar
                year={year}
                month={month}
                days={days}
                selectedDateKey={selectedDateKey}
                onSelectDate={setSelectedDateKey}
                onPrevMonth={() => goToMonth(-1)}
                onNextMonth={() => goToMonth(1)}
                onToday={() => {
                  setYear(TODAY.getFullYear());
                  setMonth(TODAY.getMonth());
                  setSelectedDateKey(todayKey);
                }}
              />
              <AttendanceLegend />
            </div>

            <div className="hidden rounded-xl border border-dashed border-border bg-surface-card p-4 text-fs-base text-muted xl:block">
              {selectedEmployee && (
                <p className="mb-1 font-medium text-ink">{selectedEmployee.name}&apos;s attendance</p>
              )}
              Select a date on the calendar to view punch-in, punch-out, working hours and the full
              activity timeline for that day.
            </div>
          </div>

          <AttendanceDetailsPanel
            dateKey={selectedDateKey}
            day={selectedDay}
            isToday={selectedDateKey === todayKey}
            onClose={() => setSelectedDateKey(null)}
            onClockOut={handleClockOut}
          />
        </>
      )}
    </div>
  );
}
