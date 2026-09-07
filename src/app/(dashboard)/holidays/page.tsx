"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, PartyPopper } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { StatCard } from "@/components/molecules/StatCard";
import { Spinner } from "@/components/atoms/Spinner";
import { HolidayBannerCard } from "@/components/organisms/holidays/HolidayBannerCard";
import { getHolidays } from "@/services/holiday.service";
import type { Holiday } from "@/types/holiday";

function daysBetween(date: Date, today: Date) {
  const ms = date.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0);
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[] | null>(null);

  useEffect(() => {
    let isMounted = true;
    getHolidays().then((data) => {
      if (isMounted) setHolidays(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const { upcoming, past, nextHoliday } = useMemo(() => {
    if (!holidays) return { upcoming: [], past: [], nextHoliday: null as Holiday | null };
    const today = new Date();
    const upcomingList = holidays.filter((h) => daysBetween(new Date(h.date), new Date(today)) >= 0);
    const pastList = holidays.filter((h) => daysBetween(new Date(h.date), new Date(today)) < 0);
    return { upcoming: upcomingList, past: pastList, nextHoliday: upcomingList[0] ?? null };
  }, [holidays]);

  return (
    <div>
      <PageHeader title="Holiday Calendar" description="Company holidays for the year, at a glance." />

      {!holidays ? (
        <div className="flex items-center justify-center gap-2 py-24 text-muted">
          <Spinner />
          Loading holidays…
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard label="Holidays This Year" value={String(holidays.length)} icon={CalendarDays} />
            <StatCard label="Upcoming" value={String(upcoming.length)} icon={PartyPopper} />
            <StatCard
              label="Next Holiday"
              value={nextHoliday ? nextHoliday.name : "—"}
              icon={PartyPopper}
            />
          </div>

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
                  <HolidayBannerCard key={holiday.id} holiday={holiday} bannerIndex={index} daysAway={null} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
