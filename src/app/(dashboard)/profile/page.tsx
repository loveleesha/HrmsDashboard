"use client";

import { useEffect, useState } from "react";
import { User as UserIcon, Camera, GraduationCap, CalendarClock, Lock, Star, FileText, Repeat } from "lucide-react";
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
import { DepartmentChangeTab } from "@/components/organisms/profile/tabs/DepartmentChangeTab";
import { useAuth } from "@/hooks/use-auth";
import { getEmployees } from "@/services/employee.service";
import type { Employee } from "@/types/employee";

const TABS: ProfileTabDef[] = [
  { value: "basic", label: "Basic Information", icon: UserIcon },
  { value: "picture", label: "Profile Picture", icon: Camera },
  { value: "qualification", label: "Qualification", icon: GraduationCap },
  { value: "shift", label: "Shift", icon: CalendarClock },
  { value: "password", label: "Change Password", icon: Lock },
  { value: "appraisal", label: "Appraisal", icon: Star },
  { value: "documents", label: "Documents", icon: FileText },
  { value: "department", label: "Department Change", icon: Repeat },
];

const LAST_LOGIN = new Intl.DateTimeFormat("en-IN", {
  month: "short",
  day: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
}).format(new Date());

export default function ProfilePage() {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [tab, setTab] = useState("basic");

  useEffect(() => {
    let isMounted = true;
    getEmployees().then((employees) => {
      if (!isMounted) return;
      setEmployee(employees.find((e) => e.email === user?.email) ?? employees[0] ?? null);
    });
    return () => {
      isMounted = false;
    };
  }, [user]);

  return (
    <div>
      <PageHeader title="My Profile" description="Your personal and employment information" />

      {user && <ProfileBanner user={user} lastLogin={LAST_LOGIN} />}

      {!employee ? (
        <div className="flex items-center justify-center gap-2 py-24 text-muted">
          <Spinner />
          Loading profile…
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
          <ProfileTabNav tabs={TABS} value={tab} onChange={setTab} />

          <div>
            {tab === "basic" && <BasicInfoTab employee={employee} />}
            {tab === "picture" && <ProfilePictureTab employee={employee} />}
            {tab === "qualification" && <QualificationTab />}
            {tab === "shift" && <ShiftTab />}
            {tab === "password" && <ChangePasswordTab />}
            {tab === "appraisal" && <AppraisalTab />}
            {tab === "documents" && <MyDocumentsTab />}
            {tab === "department" && <DepartmentChangeTab employee={employee} />}
          </div>
        </div>
      )}
    </div>
  );
}
