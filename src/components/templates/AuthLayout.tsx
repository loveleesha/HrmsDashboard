import type { ReactNode } from "react";

export interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <main className="w-full max-w-md rounded-2xl border border-border bg-surface-card p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-fs-3xl font-bold text-white">
            H
          </div>
          <p className="text-fs-base font-medium uppercase tracking-wide text-primary">
            {eyebrow}
          </p>
          <h1 className="mt-1 text-fs-6xl font-bold text-ink">{title}</h1>
          <p className="mt-2 text-fs-lg text-muted">{subtitle}</p>
        </div>

        {children}

        {footer && <div className="mt-6 text-center">{footer}</div>}
      </main>
    </div>
  );
}
