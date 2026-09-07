import { Mail, IdCard, Briefcase, Clock } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import type { User } from "@/types/user";

export function ProfileBanner({ user, lastLogin }: { user: User; lastLogin: string }) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary-dark p-6 text-white">
      <div className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -right-24 bottom-0 size-64 rounded-full bg-white/5" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="flex size-20 shrink-0 items-center justify-center rounded-full border-4 border-white/30 bg-white/15 text-fs-6xl font-semibold">
          <Avatar name={user.name} size="lg" className="size-[72px] bg-white/20 text-white" />
        </span>
        <div className="min-w-0">
          <p className="text-fs-6xl font-bold">{user.name}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-fs-base text-white/90">
            <span className="flex items-center gap-1.5">
              <Mail className="size-4" />
              {user.email}
            </span>
            <span className="flex items-center gap-1.5">
              <IdCard className="size-4" />
              Employee ID: {user.employeeId}
            </span>
            <span className="flex items-center gap-1.5">
              <Briefcase className="size-4" />
              Designation: {user.designation}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-4" />
              Last Login: {lastLogin}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
