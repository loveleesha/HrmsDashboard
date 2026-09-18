"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Plus, PartyPopper } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { StatCard } from "@/components/molecules/StatCard";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { ConfirmModal } from "@/components/molecules/ConfirmModal";
import { HolidayBannerCard } from "@/components/organisms/holidays/HolidayBannerCard";
import { HolidayFormModal } from "@/components/organisms/holidays/HolidayFormModal";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/use-rbac";
import { listHolidays, createHoliday, updateHoliday, deleteHoliday } from "@/services/holiday.service";
import type { Holiday, HolidayPayload } from "@/types/holiday";

function daysBetween(date: Date, today: Date) {
  const ms = date.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0);
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => String(CURRENT_YEAR - 1 + i)).map((year) => ({
  label: year,
  value: year,
}));

export default function HolidaysPage() {
  const { showToast } = useToast();
  const { can } = useRBAC();
  const [holidays, setHolidays] = useState<Holiday[] | null>(null);
  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [prevYear, setPrevYear] = useState(year);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Holiday | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Holiday | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (year !== prevYear) {
    setPrevYear(year);
    setHolidays(null);
  }

  function refresh() {
    listHolidays(year).then(setHolidays);
  }

  useEffect(() => {
    let isMounted = true;
    listHolidays(year).then((data) => {
      if (isMounted) setHolidays(data);
    });
    return () => {
      isMounted = false;
    };
  }, [year]);

  const { upcoming, past, nextHoliday } = useMemo(() => {
    if (!holidays) return { upcoming: [], past: [], nextHoliday: null as Holiday | null };
    const today = new Date();
    const upcomingList = holidays.filter((h) => daysBetween(new Date(h.date), new Date(today)) >= 0);
    const pastList = holidays.filter((h) => daysBetween(new Date(h.date), new Date(today)) < 0);
    return { upcoming: upcomingList, past: pastList, nextHoliday: upcomingList[0] ?? null };
  }, [holidays]);

  async function handleSubmit(payload: HolidayPayload) {
    setIsSubmitting(true);
    try {
      if (editTarget) {
        await updateHoliday(editTarget.id, payload);
        showToast("Holiday updated.");
      } else {
        await createHoliday(payload);
        showToast("Holiday added.");
      }
      setFormOpen(false);
      setEditTarget(undefined);
      refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not save this holiday.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteHoliday(deleteTarget.id);
      showToast(`Deleted ${deleteTarget.name}.`);
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not delete this holiday.", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Holiday Calendar"
        description="Company holidays for the year, at a glance."
        actions={
          <div className="flex items-center gap-2">
            <FilterDropdown label="Year" options={YEAR_OPTIONS} value={year} onChange={setYear} className="w-28" />
            {can("holidays", "add") && (
              <Button onClick={() => { setEditTarget(undefined); setFormOpen(true); }}>
                <Plus className="size-4" />
                Add Holiday
              </Button>
            )}
          </div>
        }
      />

      {!holidays ? (
        <div className="flex items-center justify-center gap-2 py-24 text-muted">
          <Spinner />
          Loading holidays…
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard label={`Holidays in ${year}`} value={String(holidays.length)} icon={CalendarDays} />
            <StatCard label="Upcoming" value={String(upcoming.length)} icon={PartyPopper} />
            <StatCard label="Next Holiday" value={nextHoliday ? nextHoliday.name : "—"} icon={PartyPopper} />
          </div>

          {holidays.length === 0 && (
            <p className="rounded-xl border border-dashed border-border bg-surface-card px-6 py-16 text-center text-fs-base text-muted">
              No holidays added for {year} yet.
            </p>
          )}

          {upcoming.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-3 text-fs-xl font-semibold text-ink">Upcoming</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {upcoming.map((holiday, index) => (
                  <HolidayBannerCard
                    key={holiday.id}
                    holiday={holiday}
                    bannerIndex={index}
                    daysAway={daysBetween(new Date(holiday.date), new Date())}
                    onEdit={can("holidays", "edit") ? () => { setEditTarget(holiday); setFormOpen(true); } : undefined}
                    onDelete={can("holidays", "delete") ? () => setDeleteTarget(holiday) : undefined}
                  />
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 className="mb-3 text-fs-xl font-semibold text-ink">Earlier This Year</h2>
              <div className="grid grid-cols-1 gap-4 opacity-70 sm:grid-cols-2 xl:grid-cols-3">
                {past.map((holiday, index) => (
                  <HolidayBannerCard
                    key={holiday.id}
                    holiday={holiday}
                    bannerIndex={index}
                    daysAway={null}
                    onEdit={can("holidays", "edit") ? () => { setEditTarget(holiday); setFormOpen(true); } : undefined}
                    onDelete={can("holidays", "delete") ? () => setDeleteTarget(holiday) : undefined}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <HolidayFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(undefined); }}
        holiday={editTarget}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirmed}
        title="Delete Holiday"
        description={deleteTarget?.name}
        body="This can't be undone."
        confirmLabel="Delete Holiday"
        isConfirming={isDeleting}
      />
    </div>
  );
}
