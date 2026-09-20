import Link from "next/link";
import { Drawer } from "@/components/molecules/Drawer";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { buttonVariants } from "@/components/atoms/Button";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { isManager } from "@/services/hierarchy.service";
import { EMPLOYMENT_STATUS_LABELS } from "@/types/employee";
import type { HierarchyEmployeeRef, HierarchyProject, HierarchySummary } from "@/types/hierarchy";

export type NodeDetailsTarget =
  | { kind: "admin"; summary: HierarchySummary }
  | { kind: "project"; project: HierarchyProject }
  | { kind: "manager"; manager: HierarchyEmployeeRef; projectCount: number; employeeCount: number }
  | { kind: "employee"; employee: HierarchyEmployeeRef; projectName?: string };

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-fs-sm text-muted-light">{label}</p>
      <p className="text-fs-base text-ink">{value}</p>
    </div>
  );
}

export function NodeDetailsDrawer({ target, onClose }: { target: NodeDetailsTarget | null; onClose: () => void }) {
  return (
    <Drawer open={Boolean(target)} onClose={onClose} title="Details">
      {target?.kind === "admin" && (
        <div className="flex flex-col gap-5">
          <h2 className="text-fs-2xl font-semibold text-ink">Admin</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Projects" value={target.summary.totalProjects} />
            <Field label="Active Projects" value={target.summary.activeProjects} />
            <Field label="Managers" value={target.summary.totalManagers} />
            <Field label="Employees" value={target.summary.totalEmployees} />
          </div>
        </div>
      )}

      {target?.kind === "project" && (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="text-fs-2xl font-semibold text-ink">{target.project.name}</h2>
            <p className="text-fs-base text-muted-light">PRJ-{target.project.id.slice(-6).toUpperCase()}</p>
          </div>
          {target.project.description && <p className="text-fs-base text-muted">{target.project.description}</p>}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Status" value={<StatusBadge status={target.project.status === "active" ? "Active" : "Inactive"} />} />
            <Field label="Managers" value={target.project.managers.length} />
            <Field label="Employees" value={target.project.assignments.length} />
          </div>
          <Link href="/projects" className={buttonVariants({ variant: "secondary", size: "sm" })}>
            View in Projects
          </Link>
        </div>
      )}

      {target?.kind === "manager" && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <Avatar name={target.manager.name} imageUrl={target.manager.avatarUrl} size="lg" />
            <div>
              <h2 className="text-fs-2xl font-semibold text-ink">{target.manager.name}</h2>
              <p className="text-fs-base text-muted">{target.manager.designation || "Manager"}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Projects" value={target.projectCount} />
            <Field label="Employees" value={target.employeeCount} />
            <Field label="Department" value={target.manager.department || "—"} />
            <Field label="Status" value={<StatusBadge status={EMPLOYMENT_STATUS_LABELS[target.manager.status]} />} />
          </div>
          <Link href="/employees" className={buttonVariants({ variant: "secondary", size: "sm" })}>
            Find in Directory
          </Link>
        </div>
      )}

      {target?.kind === "employee" && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <Avatar name={target.employee.name} imageUrl={target.employee.avatarUrl} size="lg" />
            <div>
              <h2 className="text-fs-2xl font-semibold text-ink">{target.employee.name}</h2>
              <p className="text-fs-base text-muted">
                {target.employee.employeeId ?? "—"} {target.employee.designation && `· ${target.employee.designation}`}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Manager" value={target.employee.reportsTo || "—"} />
            <Field label="Project" value={target.projectName ?? "—"} />
            <Field label="Department" value={target.employee.department || "—"} />
            <Field label="Status" value={<StatusBadge status={EMPLOYMENT_STATUS_LABELS[target.employee.status]} />} />
          </div>
          {isManager(target.employee) && <Badge tone="primary">Manager</Badge>}
          <Link href="/employees" className={buttonVariants({ variant: "secondary", size: "sm" })}>
            Find in Directory
          </Link>
        </div>
      )}
    </Drawer>
  );
}
