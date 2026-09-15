"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, LogOut, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/atoms/Avatar";
import { isAdminTierRole } from "@/types/user";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";

export function UserMenu() {
  const { user, logout } = useAuth();
  const { getRoleLabel } = useRoles();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar name={user.name} size="sm" />
        <span className="hidden text-left sm:block">
          <span className="block text-fs-base font-medium text-ink">
            {user.name}
          </span>
          <span className="block text-fs-sm text-muted">
            {getRoleLabel(user.role)}
          </span>
        </span>
        <ChevronDown className="size-4 text-muted-light" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-border bg-surface-card p-1 shadow-lg"
        >
          <div className="px-3 py-2">
            <p className="text-fs-base font-medium text-ink">{user.name}</p>
            <p className="text-fs-sm text-muted">{user.email}</p>
          </div>
          <div className="my-1 h-px bg-border" />
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-fs-base text-ink hover:bg-surface"
          >
            <UserIcon className="size-4" />
            My Profile
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              const loginRoute = isAdminTierRole(user.role) ? "/admin/login" : "/login";
              logout();
              setOpen(false);
              router.push(loginRoute);
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-fs-base text-danger hover:bg-danger-bg"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
