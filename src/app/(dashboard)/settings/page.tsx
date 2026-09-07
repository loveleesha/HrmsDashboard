import Link from "next/link";
import {
  ShieldCheck,
  Building2,
  CalendarDays,
  Wallet,
  Bell,
  Lock,
  ChevronRight,
} from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader";

const SETTINGS_SECTIONS = [
  {
    title: "Role & Access",
    description: "Configure module and action-level permissions for every role.",
    icon: ShieldCheck,
    href: "/settings/roles",
    live: true,
  },
  {
    title: "Organization",
    description: "Business units, departments, and reporting structure.",
    icon: Building2,
    href: "/organization",
    live: true,
  },
  {
    title: "Leave Types",
    description: "Define leave types, accrual rules, and carry-forward policy.",
    icon: CalendarDays,
    href: "/leave",
    live: true,
  },
  {
    title: "Payroll Cycles",
    description: "Pay schedules, salary components, and tax settings.",
    icon: Wallet,
    href: "/payroll",
    live: false,
  },
  {
    title: "Notifications",
    description: "Control which events trigger email and in-app alerts.",
    icon: Bell,
    href: "#",
    live: false,
  },
  {
    title: "Security",
    description: "Password policy, session timeout, and audit logs.",
    icon: Lock,
    href: "#",
    live: false,
  },
];

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Organization, HR, payroll, notification, and security settings"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SETTINGS_SECTIONS.map((section) => (
          <Link
            key={section.title}
            href={section.href}
            className="group flex flex-col gap-3 rounded-xl border border-border bg-surface-card p-5 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <section.icon className="size-5" />
              </span>
              <ChevronRight className="size-4 text-muted-light transition-transform group-hover:translate-x-0.5" />
            </div>
            <div>
              <p className="flex items-center gap-2 text-fs-xl font-semibold text-ink">
                {section.title}
                {!section.live && (
                  <span className="rounded-full bg-surface px-2 py-0.5 text-fs-sm font-normal text-muted-light">
                    Coming soon
                  </span>
                )}
              </p>
              <p className="mt-1 text-fs-base text-muted">{section.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
