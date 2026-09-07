"use client";

import { useState } from "react";
import { Cake, Check, PartyPopper } from "lucide-react";
import { WidgetCard } from "@/components/molecules/WidgetCard";
import { Carousel } from "@/components/molecules/Carousel";
import { Avatar } from "@/components/atoms/Avatar";
import { Button } from "@/components/atoms/Button";
import type { BirthdayEntry } from "@/types/dashboard";

export function BirthdayWidget({ entries }: { entries: BirthdayEntry[] }) {
  const [wishedNames, setWishedNames] = useState<string[]>([]);

  return (
    <WidgetCard title="Upcoming Birthdays" icon={Cake}>
      {entries.length === 0 ? (
        <p className="py-10 text-center text-fs-base text-muted">No birthdays coming up.</p>
      ) : (
        <Carousel
          slides={entries.map((entry) => {
            const alreadyWished = wishedNames.includes(entry.name);
            return (
              <div
                key={entry.name}
                className="relative flex flex-col items-center gap-2 overflow-hidden rounded-xl bg-birthday-bg px-4 py-6 text-center"
              >
                <PartyPopper className="absolute left-3 top-3 size-5 text-birthday-gold" />
                <PartyPopper className="absolute right-3 top-3 size-5 rotate-90 text-birthday-purple" />
                <Avatar name={entry.name} size="lg" />
                <p className="text-fs-xl font-semibold text-ink">{entry.name}</p>
                <p className="text-fs-base text-muted">{entry.designation}</p>
                <span className="rounded-full bg-birthday-accent/15 px-3 py-1 text-fs-base font-medium text-birthday-accent">
                  {entry.date}
                </span>
                <Button
                  size="sm"
                  variant={alreadyWished ? "secondary" : "primary"}
                  disabled={alreadyWished}
                  className="mt-1"
                  onClick={() => setWishedNames((prev) => [...prev, entry.name])}
                >
                  {alreadyWished ? (
                    <>
                      <Check className="size-4" />
                      Wished
                    </>
                  ) : (
                    "Send Wishes"
                  )}
                </Button>
              </div>
            );
          })}
        />
      )}
    </WidgetCard>
  );
}
