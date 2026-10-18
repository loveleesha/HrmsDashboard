"use client";

import { useEffect, useMemo, useState } from "react";
import { UploadCloud } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { Spinner } from "@/components/atoms/Spinner";
import { Button } from "@/components/atoms/Button";
import { AttendanceSummaryCards } from "@/components/organisms/attendance/AttendanceSummaryCards";
import { AttendanceCalendar } from "@/components/organisms/attendance/AttendanceCalendar";
import { AttendanceDetailsPanel } from "@/components/organisms/attendance/AttendanceDetailsPanel";
import { AttendanceLegend } from "@/components/organisms/attendance/AttendanceLegend";
import { AttendanceImportModal } from "@/components/organisms/attendance/AttendanceImportModal";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/use-rbac";
import { getEmployees } from "@/services/employee.service";
import {
  getAttendanceSummary,
  getMyAttendanceMonth,
  getTeamAttendanceMonth,
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
  // Gates the Department/Employee switcher — viewing anyone else's attendance
  // needs attendance.approve (team-oversight tier), the same key GET
  // /api/admin/attendance itself requires; attendance.view (every role by
  // default) only ever covers your own records.
  const canViewTeam = can("attendance", "approve");
  // Same "admin sets this directly" bar as the rest of Admin > Attendance's
  // write actions (mark/edit a record) — see routes/Admin/attendanceRoutes.js.
  const canImport = can("attendance", "edit");

  const [importOpen, setImportOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [department, setDepartment] = useState("");
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [year, setYear] = useState(TODAY.getFullYear());
  const [month, setMonth] = useState(TODAY.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [override, setOverride] = useState<Record<string, AttendanceDay>>({});
  const [days, setDays] = useState<AttendanceDay[] | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

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
  const isSelf = selectedEmployee?.email === user?.email;

  useEffect(() => {
    if (!employeeId) return;
    let isMounted = true;
    // Without attendance.approve there's no dropdown to pick anyone else with
    // anyway (hidden below), but `employeeId` can still default to someone
    // other than the viewer (e.g. the first employee in the directory) — so
    // this must gate on canViewTeam itself, not just on `isSelf`, or an
    // account without attendance.approve would 403 trying to fetch a
    // coworker's record nobody asked to see.
    const fetchDays =
      !canViewTeam || isSelf || !selectedEmployee?.employeeRecordId
        ? getMyAttendanceMonth(year, month)
        : getTeamAttendanceMonth(selectedEmployee.employeeRecordId, year, month);
    fetchDays
      .then((result) => isMounted && setDays(result))
      .catch(() => isMounted && setDays([]));
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, isSelf, canViewTeam, year, month, reloadKey]);

  const visibleDays = useMemo(() => (days ?? []).map((day) => override[day.date] ?? day), [days, override]);

  const summary = useMemo(() => getAttendanceSummary(visibleDays), [visibleDays]);

  const todayKey = toDateKey(TODAY);
  const selectedDay = visibleDays.find((day) => day.date === selectedDateKey) ?? null;

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
        actions={
          canImport ? (
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              <UploadCloud className="size-4" />
              Attendance Upload
            </Button>
          ) : undefined
        }
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

          {days === null ? (
            <div className="flex items-center justify-center gap-2 py-24 text-muted">
              <Spinner />
              Loading attendance…
            </div>
          ) : (
            <>
              <AttendanceSummaryCards summary={summary} />

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[7fr_3fr]">
                <div className="flex flex-col gap-4">
                  <AttendanceCalendar
                    year={year}
                    month={month}
                    days={visibleDays}
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
        </>
      )}

      {canImport && (
        <AttendanceImportModal open={importOpen} onClose={() => setImportOpen(false)} onImported={() => setReloadKey((k) => k + 1)} />
      )}
    </div>
  );
}
