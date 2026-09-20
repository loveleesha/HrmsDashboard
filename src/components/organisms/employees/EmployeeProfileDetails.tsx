"use client";

import { useEffect, useState } from "react";
import { Cake, FileText, Home, ShieldCheck, VenusAndMars } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Spinner } from "@/components/atoms/Spinner";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { getEmployeeProfile } from "@/services/profile.service";
import { GENDER_LABELS, type Gender } from "@/types/onboarding";
import type { MyProfile } from "@/types/profile";

/** Mounted per employee (keyed by the parent), so it fetches once on mount. */
export function EmployeeProfileDetails({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getEmployeeProfile(userId)
      .then((data) => {
        if (isMounted) setProfile(data);
      })
      .catch((err) => {
        if (isMounted) setError(err instanceof Error ? err.message : "Could not load the full profile.");
      });
    return () => {
      isMounted = false;
    };
  }, [userId]);

  if (error) return <p className="text-fs-sm text-danger">{error}</p>;
  if (!profile) {
    return (
      <div className="flex items-center gap-2 text-fs-sm text-muted">
        <Spinner />
        Loading full profile…
      </div>
    );
  }

  const address = [profile.address?.addressLine, profile.address?.city, profile.address?.state, profile.address?.pincode]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-2 rounded-lg border border-border p-3 text-fs-base">
        {profile.roleLabel && (
          <div className="flex items-center gap-2 text-muted">
            <ShieldCheck className="size-4 shrink-0" />
            {profile.roleLabel}
          </div>
        )}
        {profile.dateOfBirth && (
          <div className="flex items-center gap-2 text-muted">
            <Cake className="size-4 shrink-0" />
            {new Date(profile.dateOfBirth).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </div>
        )}
        {profile.gender && (
          <div className="flex items-center gap-2 text-muted">
            <VenusAndMars className="size-4 shrink-0" />
            {GENDER_LABELS[profile.gender as Gender] ?? profile.gender}
          </div>
        )}
        {address && (
          <div className="flex items-center gap-2 text-muted">
            <Home className="size-4 shrink-0" />
            {address}
          </div>
        )}
      </div>

      {profile.qualifications.length > 0 && (
        <div>
          <p className="mb-2 text-fs-base font-semibold text-ink">Qualifications</p>
          <div className="flex flex-col gap-2">
            {profile.qualifications.map((q) => (
              <div key={q.id} className="rounded-lg bg-surface px-3 py-2 text-fs-base">
                <p className="font-medium text-ink">
                  {q.boardOrDegree} <span className="font-normal text-muted">· {q.type}</span>
                </p>
                <p className="text-fs-sm text-muted">
                  {[q.institution, [q.startYear, q.endYear].filter(Boolean).join(" - ")].filter(Boolean).join(" · ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.emergencyContacts.length > 0 && (
        <div>
          <p className="mb-2 text-fs-base font-semibold text-ink">Emergency Contacts</p>
          <div className="flex flex-col gap-2">
            {profile.emergencyContacts.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2 text-fs-base">
                <div>
                  <p className="font-medium text-ink">
                    {c.name} <span className="font-normal text-muted">· {c.relationship}</span>
                  </p>
                  <p className="text-fs-sm text-muted">{c.mobile}</p>
                </div>
                {c.isPrimary && <Badge tone="primary">Primary</Badge>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-fs-base font-semibold text-ink">Documents</p>
        {profile.documents.length === 0 ? (
          <p className="text-fs-sm text-muted">No documents on file.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {profile.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2 text-fs-base">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-ink">
                    <FileText className="size-4 shrink-0 text-muted-light" />
                    <span className="truncate">{doc.name}</span>
                  </p>
                  {doc.verificationStatus && (
                    <div className="mt-1">
                      <StatusBadge status={doc.verificationStatus} />
                    </div>
                  )}
                </div>
                {doc.fileUrl ? (
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-fs-sm text-primary hover:underline">
                    View
                  </a>
                ) : (
                  <span className="text-fs-sm text-muted-light">No file</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
