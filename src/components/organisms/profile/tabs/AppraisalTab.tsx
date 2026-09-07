"use client";

import { useEffect, useState } from "react";
import { RatingStars } from "@/components/molecules/RatingStars";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { Spinner } from "@/components/atoms/Spinner";
import { getMyAppraisals } from "@/services/appraisal.service";
import type { AppraisalEntry } from "@/types/appraisal";

export function AppraisalTab() {
  const [appraisals, setAppraisals] = useState<AppraisalEntry[] | null>(null);

  useEffect(() => {
    let isMounted = true;
    getMyAppraisals().then((data) => {
      if (isMounted) setAppraisals(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  if (!appraisals) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted">
        <Spinner />
        Loading appraisal history…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {appraisals.map((appraisal) => (
        <div key={appraisal.id} className="rounded-xl border border-border bg-surface-card p-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-fs-lg font-semibold text-ink">{appraisal.cycle}</p>
            <StatusBadge status={appraisal.status} />
          </div>
          {appraisal.status === "Completed" ? (
            <>
              <div className="mb-2 flex items-center gap-3">
                <RatingStars rating={appraisal.rating} />
                <span className="text-fs-base font-medium text-ink">{appraisal.ratingLabel}</span>
              </div>
              <p className="text-fs-base text-muted">{appraisal.comments}</p>
              <p className="mt-2 text-fs-sm text-muted-light">
                Reviewed by {appraisal.reviewedBy} ·{" "}
                {new Date(appraisal.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </>
          ) : (
            <p className="text-fs-base text-muted">{appraisal.comments}</p>
          )}
        </div>
      ))}
    </div>
  );
}
