import type { ReactNode } from "react";
import { CalendarCheck, FileCheck2, LifeBuoy } from "lucide-react";

export interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

const BACKGROUND = { backgroundImage: "url(/auth-bg.svg)" };

const HIGHLIGHTS = [
  { icon: CalendarCheck, label: "Attendance, leave & holidays in one place" },
  { icon: FileCheck2, label: "Onboarding and documents, done digitally" },
  { icon: LifeBuoy, label: "Support tickets answered by HR, fast" },
];

export function AuthLayout({ eyebrow, title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-cover bg-center" style={BACKGROUND}>
      {/* Brand panel — desktop only; the artwork is the page background, so it runs seamlessly behind the form too. */}
      <aside className="relative hidden flex-1 flex-col justify-between overflow-hidden p-12 text-white lg:flex xl:p-16">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-white/15 text-fs-3xl font-bold ring-1 ring-white/30 backdrop-blur">
            H
          </span>
          <div>
            <p className="text-fs-2xl font-semibold leading-tight">Hike Associate</p>
            <p className="text-fs-base text-white/75">HR Management</p>
          </div>
        </div>

        <div className="max-w-lg">
          <h2 className="text-[2.5rem] font-bold leading-tight xl:text-5xl">Everything your people need, in one place.</h2>
          <p className="mt-4 text-fs-xl text-white/80">
            One secure workspace for the whole employee journey — from the first day to the last payslip.
          </p>
          <ul className="mt-8 flex flex-col gap-3">
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15 backdrop-blur">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="size-5" />
                </span>
                <span className="text-fs-lg">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-fs-base text-white/70">© {new Date().getFullYear()} Hike Associate. All rights reserved.</p>
      </aside>

      <div className="relative flex w-full items-center justify-center px-4 py-10 sm:px-8 lg:w-[540px] lg:shrink-0 xl:w-[600px]">
        <main className="relative w-full max-w-md rounded-2xl border border-white/40 bg-surface-card/95 p-6 shadow-2xl backdrop-blur-md sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-fs-3xl font-bold text-white shadow-lg shadow-primary/30 lg:hidden">
              H
            </div>
            <p className="text-fs-base font-medium uppercase tracking-wide text-primary">{eyebrow}</p>
            <h1 className="mt-1 text-fs-6xl font-bold text-ink">{title}</h1>
            <p className="mt-2 text-fs-lg text-muted">{subtitle}</p>
          </div>

          {children}

          {footer && <div className="mt-6 text-center">{footer}</div>}
        </main>
      </div>
    </div>
  );
}
