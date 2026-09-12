import type { ModulePermissions, RolePermissionMap } from "@/types/rbac";
import type { Role } from "@/types/user";

/**
 * The default RBAC permission matrix: one RolePermissionMap per role. This is
 * the single source of truth the whole app reads from (sidebar, route guard,
 * action buttons). It ships as static config so the frontend can simulate
 * roles today; swapping `getDefaultPermissions()`'s body for a call to the
 * Node.js RBAC API is the entire migration path later.
 *
 * Every employee gets a self-service baseline (their own attendance, leave,
 * payslips, documents, performance, recognition); role-specific grants layer
 * on top of that for the modules/actions that role actually owns.
 */

const VIEW: ModulePermissions = { view: true };
const VIEW_ADD: ModulePermissions = { view: true, add: true };
const VIEW_ADD_EDIT: ModulePermissions = { view: true, add: true, edit: true };
const FULL_NO_DELETE: ModulePermissions = { view: true, add: true, edit: true, approve: true, reject: true, export: true };
const FULL: ModulePermissions = {
  view: true,
  add: true,
  edit: true,
  delete: true,
  approve: true,
  reject: true,
  export: true,
  toggleStatus: true,
  verifyDocuments: true,
  activate: true,
};

const SELF_SERVICE: RolePermissionMap = {
  dashboard: VIEW,
  employees: VIEW, // the directory is visible to everyone; only add/edit/delete are restricted
  attendance: VIEW_ADD,
  leave: VIEW_ADD,
  payroll: VIEW,
  documents: VIEW_ADD,
  performance: VIEW,
  training: VIEW,
  peerRecognition: VIEW_ADD,
  announcements: VIEW,
  holidays: VIEW,
  expenses: VIEW_ADD,
  assets: VIEW_ADD,
  dsr: VIEW_ADD,
  projects: VIEW,
  tickets: VIEW_ADD,
};

export const DEFAULT_ROLE_PERMISSIONS: Record<Role, RolePermissionMap> = {
  super_admin: {
    dashboard: FULL,
    employees: FULL,
    employeeOnboarding: FULL,
    attendance: FULL,
    leave: FULL,
    payroll: FULL,
    recruitment: FULL,
    performance: FULL,
    training: FULL,
    documents: FULL,
    expenses: FULL,
    assets: FULL,
    peerRecognition: FULL,
    announcements: FULL,
    holidays: FULL,
    organization: FULL,
    reports: FULL,
    settings: FULL,
    roleAccess: FULL,
    dsr: FULL,
    projects: FULL,
    tickets: FULL,
  },

  hr_admin: {
    ...SELF_SERVICE,
    employees: FULL,
    employeeOnboarding: { view: true, add: true, edit: true, verifyDocuments: true, activate: true },
    attendance: FULL_NO_DELETE,
    leave: FULL_NO_DELETE,
    payroll: { view: true, add: true, edit: true, approve: true, export: true },
    recruitment: FULL,
    performance: { view: true, add: true, edit: true, approve: true },
    training: { view: true, add: true, edit: true, delete: true },
    documents: { view: true, add: true, edit: true, delete: true },
    expenses: FULL_NO_DELETE,
    assets: { view: true, add: true, edit: true, toggleStatus: true },
    announcements: { view: true, add: true, edit: true, delete: true },
    holidays: { view: true, add: true, edit: true, delete: true },
    organization: { view: true, add: true, edit: true, delete: true },
    reports: { view: true, export: true },
    settings: { view: true, edit: true },
    roleAccess: VIEW,
    dsr: { view: true, add: true, edit: true, approve: true },
    tickets: { view: true, add: true, edit: true, delete: true },
  },

  hr_executive: {
    ...SELF_SERVICE,
    employees: VIEW_ADD_EDIT,
    employeeOnboarding: { view: true, add: true, edit: true, verifyDocuments: true },
    attendance: { view: true, add: true, edit: true, approve: true },
    leave: { view: true, add: true, approve: true, reject: true },
    performance: { view: true, edit: true },
    training: VIEW_ADD_EDIT,
    documents: { view: true, add: true, edit: true, delete: true },
    announcements: VIEW_ADD,
  },

  manager: {
    ...SELF_SERVICE,
    employees: VIEW,
    attendance: { view: true, add: true, approve: true },
    leave: { view: true, add: true, approve: true, reject: true },
    performance: { view: true, edit: true, approve: true },
    expenses: { view: true, add: true, approve: true, reject: true },
    reports: { view: true, export: true },
    dsr: { view: true, add: true, approve: true },
  },

  employee: {
    ...SELF_SERVICE,
  },

  special_employee: {
    ...SELF_SERVICE,
    reports: VIEW,
    performance: VIEW_ADD_EDIT,
  },

  recruiter: {
    ...SELF_SERVICE,
    employees: VIEW,
    recruitment: FULL,
    reports: VIEW,
  },

  payroll_admin: {
    ...SELF_SERVICE,
    employees: VIEW,
    payroll: FULL_NO_DELETE,
    reports: { view: true, export: true },
  },
};

export function can(
  permissions: RolePermissionMap | undefined,
  moduleKey: string,
  action: string = "view"
): boolean {
  const modulePermissions = permissions?.[moduleKey as keyof RolePermissionMap];
  return Boolean(modulePermissions?.[action as keyof ModulePermissions]);
}

export function hasAnyAccess(permissions: RolePermissionMap | undefined, moduleKey: string): boolean {
  const modulePermissions = permissions?.[moduleKey as keyof RolePermissionMap];
  if (!modulePermissions) return false;
  return Object.values(modulePermissions).some(Boolean);
}
