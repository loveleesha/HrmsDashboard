"use client";

import { useEffect, useState } from "react";
import { User as UserIcon, Camera, GraduationCap, CalendarClock, Lock, Star, FileText, Repeat, UserX, FolderKanban } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Spinner } from "@/components/atoms/Spinner";
import { ProfileBanner } from "@/components/organisms/profile/ProfileBanner";
import { ProfileTabNav, type ProfileTabDef } from "@/components/organisms/profile/ProfileTabNav";
import { BasicInfoTab } from "@/components/organisms/profile/tabs/BasicInfoTab";
import { ProfilePictureTab } from "@/components/organisms/profile/tabs/ProfilePictureTab";
import { QualificationTab } from "@/components/organisms/profile/tabs/QualificationTab";
import { ShiftTab } from "@/components/organisms/profile/tabs/ShiftTab";
import { ChangePasswordTab } from "@/components/organisms/profile/tabs/ChangePasswordTab";
import { AppraisalTab } from "@/components/organisms/profile/tabs/AppraisalTab";
import { MyDocumentsTab } from "@/components/organisms/documents/MyDocumentsTab";
import { MyProjectsTab } from "@/components/organisms/projects/MyProjectsTab";
import { DepartmentChangeTab } from "@/components/organisms/profile/tabs/DepartmentChangeTab";
import { useAuth } from "@/hooks/use-auth";
import { getMyProfile, ProfileNotFoundError } from "@/services/profile.service";
import type { MyProfile } from "@/types/profile";

const TABS: ProfileTabDef[] = [
  { value: "basic", label: "Basic Information", icon: UserIcon },
  { value: "picture", label: "Profile Picture", icon: Camera },
  { value: "qualification", label: "Qualification", icon: GraduationCap },
  { value: "shift", label: "Shift", icon: CalendarClock },
  { value: "password", label: "Change Password", icon: Lock },
  { value: "appraisal", label: "Appraisal", icon: Star },
  { value: "documents", label: "Documents", icon: FileText },
  { value: "projects", label: "My Projects", icon: FolderKanban },
  { value: "department", label: "Department Change", icon: Repeat },
];

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [profileMissing, setProfileMissing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState("basic");

  useEffect(() => {
    // Skip while the session is still rehydrating from localStorage — user
    // briefly starts out null on every load, and firing here too would send
    // a duplicate request moments before the real one below.
    if (isLoading || !user) return;

    let isMounted = true;
    getMyProfile()
      .then((data) => {
        if (isMounted) setProfile(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        if (err instanceof ProfileNotFoundError) {
          setProfileMissing(true);
        } else {
          setLoadError(err instanceof Error ? err.message : "Could not load your profile.");
        }
      });
    return () => {
      isMounted = false;
    };
  }, [user, isLoading]);

  return (
    <div>
      <PageHeader title="My Profile" description="Your personal and employment information" />

      {user && <ProfileBanner user={user} profile={profile} />}

      {profileMissing ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface-card px-6 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-warning-bg text-warning">
            <UserX className="size-7" />
          </span>
          <h2 className="text-fs-2xl font-semibold text-ink">No employee profile on file</h2>
          <p className="max-w-md text-fs-base text-muted">
            This account hasn&apos;t been onboarded as an employee yet, so there&apos;s no personal or employment
            information to show. You can still change your password below.
          </p>
          <div className="mt-2 w-full max-w-md">
            <ChangePasswordTab />
          </div>
        </div>
      ) : loadError ? (
        <p className="rounded-xl border border-dashed border-border bg-surface-card px-6 py-16 text-center text-fs-base text-danger">
          {loadError}
        </p>
      ) : !profile ? (
        <div className="flex items-center justify-center gap-2 py-24 text-muted">
          <Spinner />
          Loading profile…
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
          <ProfileTabNav tabs={TABS} value={tab} onChange={setTab} />

          <div>
            {tab === "basic" && <BasicInfoTab employee={profile} onProfileUpdated={setProfile} />}
            {tab === "picture" && (
              <ProfilePictureTab
                employee={profile}
                onUploaded={(avatarUrl) => setProfile((prev) => (prev ? { ...prev, avatarUrl } : prev))}
              />
            )}
            {tab === "qualification" && <QualificationTab initialQualifications={profile.qualifications} />}
            {tab === "shift" && <ShiftTab />}
            {tab === "password" && <ChangePasswordTab />}
            {tab === "appraisal" && <AppraisalTab />}
            {tab === "documents" && <MyDocumentsTab />}
            {tab === "projects" && <MyProjectsTab />}
            {tab === "department" && <DepartmentChangeTab employee={profile} />}
          </div>
        </div>
      )}
    </div>
  );
}
