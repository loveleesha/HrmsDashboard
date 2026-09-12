# Hike Associate HRMS — Backend Requirements

**Audience:** the backend engineer(s) building the Node.js API this Next.js frontend will
consume.

**Source of truth:** every field, enum, and endpoint below is reverse-engineered directly from
the current frontend — the TypeScript types in `src/types/*.ts`, the RBAC config in
`src/lib/rbac/*.ts`, and the mock "services" in `src/services/*.ts`. If anything here seems to
disagree with the code, the code wins — but please flag the mismatch so this doc can be fixed.

---

## 0. How the frontend is built today (read this first)

- There is **no real backend yet**. Every screen reads from `src/services/<module>.service.ts`,
  which today returns hardcoded mock arrays after a fake `delay()`. Your job is to replace what's
  behind those functions with real HTTP calls — **keeping the same function name, parameters, and
  return type** — so the swap is close to a drop-in. A small `src/lib/api-client.ts` (base URL +
  `credentials: "include"` + envelope unwrapping) still needs to be created for this; it doesn't
  exist yet.

- **Important gap you need to fill in, not just mirror:** almost every service file only exports
  a `getX()` fetcher (and sometimes a `newXId()` helper that generates a client-side temporary
  id). There are **no `createX`/`updateX`/`deleteX` functions in the mock layer today** — when a
  user "adds a leave request" or "approves a DSR entry" in the UI, the page component just pushes
  into local React state (`setLeaveRequests(...)`) and throws it away on refresh. That's the part
  that needs a real, persistent backend. Each module's section below spells out exactly which
  create/update/delete/approve endpoints are implied by what the UI already lets a user do, plus
  the RBAC action that must gate each one.

- All dates are ISO date strings (`YYYY-MM-DD`). All timestamps the UI generates itself are ISO
  8601 (`toISOString()`). Send dates back in the same format.

- All IDs are strings. The mock layer uses human-readable prefixes (`EMP-1101`, `LR-3001`,
  `DSR-9001`, `TCK-01`...) purely for readability in mock data — your IDs don't need to match that
  format, just stay opaque strings the frontend never parses.

- Money (`amount`, `gross`, `net`, `deductions`...) is a plain JS number in ₹, no paise/decimals
  used anywhere in the current UI.

- **There is currently no server-side authorization at all.** Every permission check today
  happens only in the browser (`can(module, action)` — see §2). Treat re-implementing every one
  of those checks server-side as the single highest-priority piece of this build. Nothing in the
  current app should be trusted as a security boundary once there's a real API behind it.

### Tables & pagination

Every list screen in the app uses one shared `<Table>` component
(`src/components/molecules/Table.tsx`) that paginates client-side today (default page size 10).
List endpoints should return a **paginated envelope** so this becomes server-side pagination
instead of "fetch everything, then slice in the browser":

```json
{
  "success": true,
  "data": [ /* page of items */ ],
  "page": 1,
  "pageSize": 20,
  "total": 143
}
```

Standard query params on every list endpoint: `page`, `pageSize`, plus whatever filters that
module's UI already offers (each module section below lists its filters).

### Response envelope

```json
// success
{ "success": true, "data": { /* ... */ } }

// error
{ "success": false, "error": { "code": "FORBIDDEN", "message": "...", "details": {} } }
```

---

## Table of Contents

1. [Authentication & Sessions](#1-authentication--sessions)
2. [RBAC — Roles, Modules, Actions, Permission Matrix](#2-rbac--roles-modules-actions-permission-matrix)
3. [Employee Directory](#3-employee-directory)
4. [Attendance](#4-attendance)
5. [Leave](#5-leave)
6. [Payroll](#6-payroll)
7. [Recruitment (ATS)](#7-recruitment-ats)
8. [Performance](#8-performance)
9. [Training](#9-training)
10. [DSR (Daily Status Report)](#10-dsr-daily-status-report)
11. [My Projects & Hours](#11-my-projects--hours)
12. [Support Tickets](#12-support-tickets)
13. [Assets](#13-assets)
14. [Expenses](#14-expenses)
15. [Documents (personal + company)](#15-documents-personal--company)
16. [Peer Recognition](#16-peer-recognition)
17. [Announcements](#17-announcements)
18. [Holiday Calendar](#18-holiday-calendar)
19. [Organization](#19-organization)
20. [Reports](#20-reports)
21. [Profile extras — Qualifications, Appraisals, Department Change](#21-profile-extras--qualifications-appraisals-department-change)
22. [Dashboard (aggregate feed)](#22-dashboard-aggregate-feed)
23. [Cross-cutting concerns](#23-cross-cutting-concerns)
24. [Appendix: full default permission matrix](#24-appendix-full-default-permission-matrix)

---

## 1. Authentication & Sessions

Current mock (`src/services/auth.service.ts`):

- `login(email, password)` — finds a user by email in a hardcoded `MOCK_USERS` list, accepts
  **any** password ≥ 6 characters (no real check), then sets a cookie `hrms_session` whose value
  is the **user's email in plaintext**.
- `logout()` — clears that cookie.
- `getSessionUser()` — reads the cookie, re-finds the user by email, returns it. Called
  synchronously (not async) by `src/hooks/use-auth.tsx` today.

**Required real behavior:**

| Endpoint | Method | Body | Returns | Notes |
|---|---|---|---|---|
| `/auth/login` | POST | `{ email, password }` | `User` | Real password hashing (bcrypt/argon2). Issue a real session — JWT or opaque token — in an **httpOnly** cookie. Never put the role or any permission data in a client-readable cookie. |
| `/auth/logout` | POST | — | 204 | Invalidate the session server-side, not just clear the cookie. |
| `/auth/me` | GET | — | `User` | Resolves the current session → user. **Must re-read the user's role from the database on every call** — don't cache it in the token — so a role change or deactivation takes effect on the user's very next request without forcing re-login. |

**`User` shape** (`src/types/user.ts`):

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `employeeId` | string | FK → Employee |
| `name` | string | |
| `email` | string | unique, login identifier |
| `role` | `Role` | see §2.1 — the user's real assigned role |
| `designation` | string | denormalized from Employee for quick header/menu display |
| `department` | string | denormalized from Employee |
| `avatarUrl` | string? | optional |

Because the frontend re-resolves the full session via `/auth/me` on load, **the session
token/cookie should carry only an opaque user id** — role, permissions, everything else gets
re-read fresh every time. This is what makes role reassignment (§3) and permission-matrix edits
(§2) take effect immediately with no re-login required.

`src/hooks/use-auth.tsx`'s `getSessionUser()` is currently synchronous; once this is wired to a
real `/auth/me` call it has to become async — flagged here because it's the one call-signature
change this migration forces on an otherwise "keep the signature identical" rule.

---

## 2. RBAC — Roles, Modules, Actions, Permission Matrix

**This is the backbone of the app. Every module's write/approve/delete/export endpoint below must
independently re-check this server-side — the frontend check is UX only.**

### 2.1 Roles

```
super_admin | hr_admin | hr_executive | manager | employee | special_employee | recruiter | payroll_admin
```

(`src/types/user.ts` — `ROLES`. `special_employee` behaves like `employee` with two extra grants;
see the appendix.)

### 2.2 Modules & their actions

21 modules, each gating one route and a fixed set of actions (`src/lib/rbac/modules.ts` —
`MODULE_DEFS`, the single source everything else, including the sidebar, is generated from):

| Module key | Route | Actions | Group |
|---|---|---|---|
| `dashboard` | `/dashboard` | view | Overview |
| `employees` | `/employees` | view, add, edit, delete, export | Workforce |
| `attendance` | `/attendance` | view, add, edit, approve, export | Workforce |
| `leave` | `/leave` | view, add, edit, delete, approve, reject, export | Workforce |
| `payroll` | `/payroll` | view, add, edit, approve, export | Workforce |
| `recruitment` | `/recruitment` | view, add, edit, delete, approve | Talent |
| `performance` | `/performance` | view, add, edit, approve | Talent |
| `training` | `/training` | view, add, edit, delete | Talent |
| `dsr` | `/dsr` | view, add, edit, approve | My Workspace |
| `projects` | `/projects` | view | My Workspace |
| `tickets` | `/tickets` | view, add, edit, delete | My Workspace |
| `documents` | `/documents` | view, add, edit, delete | Resources |
| `expenses` | `/expenses` | view, add, edit, delete, approve, reject | Resources |
| `assets` | `/assets` | view, add, edit, toggleStatus | Resources |
| `peerRecognition` | `/recognition` | view, add | Resources |
| `announcements` | `/announcements` | view, add, edit, delete | Resources |
| `holidays` | `/holidays` | view, add, edit, delete | Resources |
| `organization` | `/organization` | view, add, edit, delete | Administration |
| `reports` | `/reports` | view, export | Administration |
| `settings` | `/settings` | view, edit | Administration |
| `roleAccess` | `/settings/roles` | view, edit | Administration |

Not every module supports every action in §2.3 — the table above is the exact set per module;
keep it available via an API too (`GET /rbac/permissions` already returns it implicitly through
the matrix shape), not hardcoded only in the client.

### 2.3 Actions

```
view | add | edit | delete | approve | reject | export | toggleStatus
```

### 2.4 Permission matrix shape

```ts
type ModulePermissions   = Partial<Record<ActionKey, boolean>>
type RolePermissionMap   = Partial<Record<ModuleKey, ModulePermissions>>
type PermissionMatrix    = Record<Role, RolePermissionMap>   // 8 roles × 21 modules
```

A module missing from a role's map (or an action missing/`false` within it) = **no access**. The
full default matrix the frontend ships with is in **§24**; seed the database with it exactly.

### 2.5 Endpoints

| Endpoint | Method | Body | Returns | Notes |
|---|---|---|---|---|
| `/rbac/permissions` | GET | — | `PermissionMatrix` | Frontend fetches this once per session (`src/hooks/use-rbac.tsx`) and evaluates `can(module, action)` client-side from it. |
| `/rbac/permissions/:role/:module/:action` | PUT | `{ value: boolean }` | 204 | Single-cell edit — powers the Role & Access → Permissions matrix UI. Only a role with `roleAccess.edit` may call this. |
| `/rbac/permissions/reset` | POST | — | `PermissionMatrix` | Restores the shipped defaults (§24). |
| `/employees/:id/role` | PATCH | `{ role: Role }` | `User` | Reassigns a user's role — powers the "Assign Role" page (`AssignRolesTable.tsx`). Gate this on `roleAccess.edit`, **not** `employees.edit`. |

**Critical, already-verified nuance — read before wiring documents/assets:** `documents.add` and
`assets.add` are the **self-service baseline** every single role gets (upload my own document /
request an asset for myself). But `documents.edit`/`assets.edit`/`assets.toggleStatus` are what
gate *company-wide* document publishing and inventory management. The frontend already gates the
"Add Company Document" and "Add Inventory Asset" buttons on the `edit` action, not `add` — see
`src/components/organisms/documents/CompanyDocumentsTab.tsx` and
`src/app/(dashboard)/assets/page.tsx`. **Mirror this exactly**: `POST /documents/me` and
`POST /assets/requests` should check `documents.add`/`assets.add`; `POST /documents/company` and
`POST /assets/inventory` must check `documents.edit`/`assets.edit` instead — checking the wrong
action on the wrong endpoint would let any employee publish company-wide documents or add
inventory items.

**Role simulation note:** today the RBAC provider also supports a client-only "view as role"
simulator for demoing the UI (`viewAsRole` in `use-rbac.tsx`, persisted to `localStorage`, not
tied to the real session). That's a frontend-only demo feature — **do not** build a
server-side equivalent; the real backend only ever has one role: the signed-in user's actual
role from the database.

---

## 3. Employee Directory

**Type** (`src/types/employee.ts`):

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `name` | string | |
| `email` | string | unique |
| `phone` | string | |
| `avatarUrl` | string? | |
| `designation` | string | free text |
| `level` | `Manager\|Senior\|Associate\|Executive\|Intern` | |
| `department` | `Engineering\|HR\|Finance\|Marketing\|Sales\|Operations` | |
| `city` | string | |
| `workLocationType` | `Office\|Remote\|Hybrid` | |
| `status` | `Active\|On Leave\|Remote\|Inactive` | |
| `performanceScore` | number | |
| `skills` | string[] | |
| `badges` | string[] | recognition badge keys earned — see §16 |
| `joinedDate` | ISO date | |
| `manager` | string? | manager's **name** (not id) today — see scope note below |

**Scope note:** a `manager` role's "team" is resolved today purely by string-matching
`Employee.manager === currentUser.name`. That's fragile (name collisions, renames) — consider
storing a real `managerId` FK in your schema and keep exposing `manager` as the resolved name for
frontend compatibility, or plan a small frontend follow-up to switch to an id-based field.

**Endpoints:**

| Endpoint | Method | Query/Body | RBAC action | Notes |
|---|---|---|---|---|
| `/employees` | GET | `page,pageSize,search,department,level,status,workLocationType` | `employees.view` | The directory (`getEmployees()`) — search matches name/designation/email. |
| `/employees/:id` | GET | — | `employees.view` | |
| `/employees` | POST | full `Employee` minus `id`, plus `password` | `employees.add` | |
| `/employees/:id` | PATCH | partial `Employee` | `employees.edit` | |
| `/employees/:id` | DELETE | — | `employees.delete` | |
| `/employees/:id/avatar` | PATCH | `{ avatarUrl }` | self OR `employees.edit` | An employee updating their **own** avatar (My Profile → Profile Picture tab) must be allowed even without `employees.edit` — check `req.user.employeeId === :id` first. |
| `/employees/export` | GET | same filters as list | `employees.export` | CSV export button on the directory toolbar. |
| `/employees/:id/role` | PATCH | see §2.5 | `roleAccess.edit` | |

---

## 4. Attendance

**Types** (`src/types/attendance.ts`):

`AttendanceDay`: `date, status (present|late|absent|leave|holiday|weekend), punchIn?, punchOut?,
workingHours?, breakDuration?, overtime?, location? (Office|Remote), shift?, notes?,
timeline? ({time,label}[]), holidayName?`

`AttendanceMonthSummary`: `present, late, absent, leave, totalWorkingDays,
averageWorkingHours, totalOvertime, attendanceRate`

Mock logic worth mirroring server-side: `getAttendanceSummary(days)` derives the summary from a
month of `AttendanceDay` rows, and `punchOutToday(day)` computes `workingHours`/`breakDuration`
relative to the actual punch-in time (not a fixed clock) — do the same server-side so the numbers
stay internally consistent regardless of when someone actually punches in.

**Endpoints:**

| Endpoint | Method | Query/Body | RBAC action | Notes |
|---|---|---|---|---|
| `/attendance/me?month=YYYY-MM` | GET | — | `attendance.view` | Self-service calendar view. |
| `/attendance/:employeeId?month=YYYY-MM` | GET | — | `attendance.view` + scope (own/team/company) | Manager viewing a report, HR viewing anyone. |
| `/attendance/punch-in` | POST | `{ location }` | `attendance.add` | |
| `/attendance/punch-out` | POST | — | `attendance.add` | Server computes `workingHours`/`breakDuration`/`overtime` — never trust client-submitted values for these. |
| `/attendance/:employeeId/:date` | PATCH | `{ status, notes, ... }` | `attendance.edit` | Manual correction by HR/manager. |
| `/attendance/export?month=` | GET | filters | `attendance.export` | |

Scope: `manager` may only view/approve their direct reports (§3 scope note); `hr_admin`,
`super_admin`, `payroll_admin` see everyone.

---

## 5. Leave

**Types** (`src/types/leave.ts`):

`LeaveType`: `Casual Leave | Sick Leave | Earned Leave | Unpaid Leave` — annual quotas
`{12, 10, 15, 0}` respectively (`LEAVE_TYPE_ANNUAL_QUOTA`).

`LeaveRequest`: `id, employeeId, employeeName, designation, department, leaveType, startDate,
endDate, days, reason, status (Pending|Approved|Rejected|Cancelled), appliedOn, approverName?,
approvedOn?, comment?`

`LeaveBalance`: `type, total, used, remaining` — derived per employee from approved requests
against the annual quota (`getLeaveBalances()` in the mock).

**Endpoints:**

| Endpoint | Method | Query/Body | RBAC action | Notes |
|---|---|---|---|---|
| `/leave?scope=me\|team\|all` | GET | `page,pageSize,status,leaveType,employeeId` | `leave.view` | |
| `/leave/balances/:employeeId` | GET | — | `leave.view` (self or manager/HR) | Server computes remaining = quota − sum(approved days), don't let the client submit `remaining` directly. |
| `/leave` | POST | `{ leaveType, startDate, endDate, reason }` | `leave.add` | `employeeId`/`employeeName`/`department` always come from the authenticated session, never the body. `days` is server-computed from the date range (mirror `calculateLeaveDays()`), not client-submitted. |
| `/leave/:id` | PATCH | `{ startDate?, endDate?, reason? }` | `leave.edit`, and only while `status === "Pending"` and only the requester | |
| `/leave/:id` | DELETE | — | `leave.delete` | Cancelling a request. |
| `/leave/:id/approve` | POST | `{ comment? }` | `leave.approve` + scope | Sets `approverName`/`approvedOn` from the session, never the body. |
| `/leave/:id/reject` | POST | `{ comment }` | `leave.reject` + scope | |
| `/leave/export` | GET | filters | `leave.export` | |

---

## 6. Payroll

**Types** (`src/types/payroll.ts`):

`SalaryComponent`: `{ label, amount, type: earning|deduction }` — the breakdown shown on a
payslip.

`Payslip`: `id, month, year, gross, deductions, net, status (Processed|Pending), generatedOn`

`EmployeePayrollRow` (company-wide table): `employeeId, employeeName, designation, gross,
deductions, net, status`

**Endpoints:**

| Endpoint | Method | Query/Body | RBAC action | Notes |
|---|---|---|---|---|
| `/payroll/me/salary-components` | GET | — | `payroll.view` | Self-service breakdown. |
| `/payroll/me/payslips` | GET | — | `payroll.view` | |
| `/payroll/me/payslips/:id/download` | GET | — | `payroll.view` | Returns a PDF/file — not modeled in the mock beyond the list today; needs real file generation. |
| `/payroll` | GET | `page,pageSize,department,status` | `payroll.view` + full company scope (`payroll_admin`, `hr_admin`, `super_admin`) | Company-wide table. |
| `/payroll` | POST/PATCH | salary component edits | `payroll.add`/`payroll.edit` | Running/adjusting payroll for a cycle — **`net`/`gross`/`status` must always be server-computed from the submitted earning/deduction components, never accepted as a raw client-submitted total.** |
| `/payroll/:employeeId/approve` | POST | — | `payroll.approve` | |
| `/payroll/export` | GET | filters | `payroll.export` | |

---

## 7. Recruitment (ATS)

**Types** (`src/types/recruitment.ts`):

`JobPosting`: `id, title, department, location, type (Full-time|Part-time|Contract|Internship),
status (Open|On Hold|Closed), openings, experience, postedOn`

`Candidate`: `id, name, email, phone, jobId, jobTitle, stage (Applied|Screening|Interview|
Offer|Hired|Rejected), appliedOn, experience, skills, rating, source, notes?`

`Interview`: `id, candidateId, candidateName, jobTitle, interviewer, date, time,
mode (Onsite|Video|Phone), status (Scheduled|Completed|Cancelled), round`

**Endpoints:**

| Endpoint | Method | Query/Body | RBAC action | Notes |
|---|---|---|---|---|
| `/recruitment/jobs` | GET/POST | filters / `JobPosting` minus id | `recruitment.view`/`.add` | |
| `/recruitment/jobs/:id` | PATCH/DELETE | partial / — | `recruitment.edit`/`.delete` | |
| `/recruitment/candidates?jobId=` | GET/POST | filters / `Candidate` minus id | `recruitment.view`/`.add` | |
| `/recruitment/candidates/:id/stage` | PATCH | `{ stage }` | `recruitment.approve` | Mirror `nextStage()`'s pipeline order: Applied → Screening → Interview → Offer → Hired, with Rejected reachable from any stage. Validate the transition server-side, don't trust an arbitrary stage jump from the client. |
| `/recruitment/interviews` | GET/POST | filters / `Interview` minus id | `recruitment.view`/`.add` | |
| `/recruitment/interviews/:id` | PATCH | `{ status }` | `recruitment.edit` | |

---

## 8. Performance

**Types** (`src/types/performance.ts`):

`Goal`: `id, employeeId, title, description, progress (0-100), status (Not Started|On Track|
At Risk|Completed), dueDate`

`TeamPerformanceRow`: `employeeId, employeeName, designation, currentRating, ratingLabel,
goalsCompleted, goalsTotal, lastReviewDate`

**Endpoints:**

| Endpoint | Method | Query/Body | RBAC action | Notes |
|---|---|---|---|---|
| `/performance/goals/:employeeId` | GET | — | `performance.view` (self, manager of, or HR) | |
| `/performance/goals` | POST | `Goal` minus id | `performance.add` | |
| `/performance/goals/:id` | PATCH | `{ progress?, status? }` | `performance.edit` | |
| `/performance/team` | GET | `page,pageSize` | `performance.view` + team/company scope | Manager's team performance table. |
| `/performance/team/:employeeId/review` | POST | `{ rating, comments }` | `performance.approve` | Not fully modeled in the mock (no review-submission type exists yet) — design a `PerformanceReview` shape that at minimum feeds `currentRating`/`ratingLabel`/`lastReviewDate` on `TeamPerformanceRow`. |

---

## 9. Training

**Type** (`src/types/training.ts`):

`TrainingProgram`: `id, topic, targetRole (Role), trainer, mode (Online|Offline|Hybrid), date,
status (Upcoming|Ongoing|Completed), enrolled`

**Endpoints:**

| Endpoint | Method | Query/Body | RBAC action |
|---|---|---|---|
| `/training` | GET | `page,pageSize,targetRole,mode,status` | `training.view` |
| `/training` | POST | `TrainingProgram` minus id | `training.add` |
| `/training/:id` | PATCH/DELETE | partial / — | `training.edit`/`.delete` |
| `/training/:id/enroll` | POST | — | `training.view` (self-enroll; every role gets baseline `training: VIEW`, so gate enroll on being authenticated + `view`, not a separate action — there's no dedicated enroll action in the matrix) |

---

## 10. DSR (Daily Status Report)

**Type** (`src/types/dsr.ts`) — redesigned as **one row per project, per day** (not a
breakdown array):

| Field | Type |
|---|---|
| `id` | string |
| `employeeId`, `employeeName`, `email` | string |
| `employmentType` | `Permanent\|Contract\|Intern` |
| `project` | string |
| `date` | ISO date |
| `estimatedHours` | string, `"HH:MM"` format |
| `noWorkDone` | boolean |
| `usedAiTools` | boolean |
| `description` | string |
| `status` | `Pending\|Pending - Short Leave\|Approved\|Rejected` |

**Endpoints:**

| Endpoint | Method | Query/Body | RBAC action | Notes |
|---|---|---|---|---|
| `/dsr?scope=me\|team\|all` | GET | `page,pageSize,status,project,dateFrom,dateTo` | `dsr.view` | |
| `/dsr` | POST | `{ project, date, estimatedHours, noWorkDone, usedAiTools, description }` | `dsr.add` | `employeeId`/`employeeName`/`email`/`employmentType` from session, not body. `status` always starts `Pending` server-side. |
| `/dsr/:id` | PATCH | same fields | `dsr.edit`, requester-only, only while `Pending` | |
| `/dsr/:id/approve` | POST | — | `dsr.approve` + scope | |
| `/dsr/:id/reject` | POST | `{ comment }` | `dsr.approve` (there's no separate `dsr.reject` action in the matrix — approve covers both) | |

---

## 11. My Projects & Hours

**Types** (`src/types/project.ts`):

`Project`: `{ id, name }` — a flat project catalog.

`ProjectAllocation`: `{ projectId, projectName, allocatedHoursPerDay, status (Active|Released),
dsrLoggedHours }` — `dsrLoggedHours` should be **computed** by summing that employee's approved
DSR `estimatedHours` for that project, not stored separately.

**Endpoints:**

| Endpoint | Method | Query | RBAC action |
|---|---|---|---|
| `/projects` | GET | — | `projects.view` |
| `/projects/me/allocations` | GET | — | `projects.view` |

This module is read-only in the UI today (`projects` only has a `view` action in the matrix) —
project/allocation management happens elsewhere (presumably an admin tool not yet in this
frontend); don't build write endpoints unless a future frontend change adds an admin screen for
it.

---

## 12. Support Tickets

**Type** (`src/types/ticket.ts`):

`Ticket`: `id, code, employeeId, employeeName, category (IT Support|HR Query|Payroll|
Facilities|Other), subject, description, priority (Low|Medium|High), status
(Open|In Progress|Closed), createdOn`

**Endpoints:**

| Endpoint | Method | Query/Body | RBAC action |
|---|---|---|---|
| `/tickets?scope=me\|all` | GET | `page,pageSize,status,category,priority` | `tickets.view` |
| `/tickets` | POST | `{ category, subject, description, priority }` | `tickets.add` |
| `/tickets/:id` | PATCH | `{ status?, ...editable fields }` | `tickets.edit` |
| `/tickets/:id` | DELETE | — | `tickets.delete` |

`code` (e.g. `TCK-01`) is a human-friendly sequential code generated server-side on create —
mirror `newTicketCode()`'s format if you want visual continuity, but any unique short code works.

---

## 13. Assets

**Types** (`src/types/asset.ts`):

`AssetItem` (inventory): `id, assetName, category, assetCode, brand, serialNo, model, isWorking,
company, assignedTo`

`AssetRequest`: `id, employeeId, employeeName, category, reason, priority (Low|Medium|High),
allocationType (New|Replacement), status (Pending|Approved|Rejected), requestedAt`

Categories: `Laptop, Monitor, Mobile, Headset, Accessory, Furniture`.

**Endpoints — see the §2.5 scope warning before wiring these:**

| Endpoint | Method | Query/Body | RBAC action |
|---|---|---|---|
| `/assets/inventory` | GET | `page,pageSize,category,isWorking` | `assets.view` |
| `/assets/inventory` | POST | `AssetItem` minus id | **`assets.edit`** (not `add`) |
| `/assets/inventory/:id` | PATCH | partial | `assets.edit` |
| `/assets/inventory/:id/toggle-status` | POST | `{ isWorking }` | `assets.toggleStatus` |
| `/assets/requests?scope=me\|all` | GET | `page,pageSize,status` | `assets.view` |
| `/assets/requests` | POST | `{ category, reason, priority, allocationType }` | **`assets.add`** | `employeeId`/`employeeName` from session. |
| `/assets/requests/:id/approve` | POST | — | `assets.edit` or `.toggleStatus` (whichever your RBAC design assigns to "manage requests" — the frontend currently checks `can("assets","toggleStatus") || can("assets","edit")` for this button) |

---

## 14. Expenses

**Type** (`src/types/expense.ts`):

`Expense`: `id, employeeId, employeeName, category (Travel|Meals|Accommodation|
Office Supplies|Client Entertainment|Other), description, amount, spentOn, submittedOn,
status (Pending|Approved|Rejected|Reimbursed)`

**Endpoints:**

| Endpoint | Method | Query/Body | RBAC action |
|---|---|---|---|
| `/expenses?scope=me\|team\|all` | GET | `page,pageSize,status,category` | `expenses.view` |
| `/expenses` | POST | `{ category, description, amount, spentOn }` | `expenses.add` |
| `/expenses/:id` | PATCH/DELETE | partial / — | `expenses.edit`/`.delete`, requester-only while Pending |
| `/expenses/:id/approve` | POST | — | `expenses.approve` + scope |
| `/expenses/:id/reject` | POST | `{ comment }` | `expenses.reject` + scope |
| `/expenses/:id/reimburse` | POST | — | `expenses.approve` (no dedicated action for this transition in the matrix; gate it the same as approve) |

---

## 15. Documents (personal + company)

Two distinct concepts share the `documents` module in RBAC — **see the §2.5 warning, it applies
directly here.**

**`EmployeeDocument`** (`src/types/document.ts`) — a document *I* uploaded about myself
(ID proof, certificates, etc.): `id, name, category, uploadedOn, status
(Verified|Pending Review|Rejected), sizeKb`

**`CompanyDocument`** (`src/types/company-document.ts`) — a document HR/admin publishes for
everyone: `id, title, category (Policy|Handbook|Compliance|Form|Other), uploadedBy, uploadedOn,
sizeKb`

**Endpoints:**

| Endpoint | Method | Query/Body | RBAC action |
|---|---|---|---|
| `/documents/me` | GET | — | `documents.view` |
| `/documents/me` | POST | multipart file + `{ name, category }` | `documents.add` |
| `/documents/me/:id` | DELETE | — | `documents.delete`, own document only |
| `/documents/me/:id/review` | POST | `{ status, comment? }` | `documents.edit` (HR verifying an uploaded document) |
| `/documents/company` | GET | `page,pageSize,category` | `documents.view` |
| `/documents/company` | POST | multipart file + `{ title, category }` | **`documents.edit`** (not `add` — see §2.5) |
| `/documents/company/:id` | DELETE | — | `documents.delete` |

File storage isn't modeled at all in the current mock (no upload UI wired to a real store) — pick
an S3-compatible object store or equivalent; this is new ground, not just a mirror of existing
behavior.

---

## 16. Peer Recognition

**Types** (`src/types/recognition.ts`):

11 fixed badge keys (`team-player, problem-solver, customer-champion, extra-mile, mentor,
innovator, leadership, helping-hand, star-performer, go-getter, goal-crusher`), each with a
`label`, `description`, and icon — treat this catalog as seed data, not something roles can
create/edit today (no module action exists for managing the badge catalog itself).

`Recognition`: `id, fromId, fromName, toId, toName, badge (BadgeKey), message, likes,
likedByMe?, createdAt, timestamp`

`RecognitionSummary` (derived, not stored): `given, received, badgesEarned, thisMonth` — computed
per-employee from the `Recognition` list (`buildSummary()`); also a `buildLeaderboard()` helper
ranking employees by recognitions received.

**Endpoints:**

| Endpoint | Method | Query/Body | RBAC action |
|---|---|---|---|
| `/recognition/badges` | GET | — | `peerRecognition.view` | Static catalog, seed once. |
| `/recognition` | GET | `page,pageSize,employeeId` | `peerRecognition.view` | |
| `/recognition` | POST | `{ toId, badge, message }` | `peerRecognition.add` | `fromId`/`fromName` from session; reject `fromId === toId`. |
| `/recognition/:id/like` | POST | — | `peerRecognition.view` (any authenticated user; toggle, not a distinct matrix action) | |
| `/recognition/summary/:employeeId` | GET | — | `peerRecognition.view` | Server computes given/received/badgesEarned/thisMonth — don't let the client submit these. |
| `/recognition/leaderboard` | GET | — | `peerRecognition.view` | |

---

## 17. Announcements

**Type** (`src/types/announcement.ts`):

`Announcement`: `id, title, body, postedBy, date, priority (High|Normal)`

**Endpoints:**

| Endpoint | Method | Query/Body | RBAC action |
|---|---|---|---|
| `/announcements` | GET | `page,pageSize` | `announcements.view` |
| `/announcements` | POST | `{ title, body, priority }` | `announcements.add` — `postedBy` from session |
| `/announcements/:id` | PATCH/DELETE | partial / — | `announcements.edit`/`.delete` |

---

## 18. Holiday Calendar

**Type** (`src/types/holiday.ts`):

`Holiday`: `id, name, date, type (National|Festival|Regional|Company), description`

Note: the UI renders these as **image/banner-style cards** on a standalone `/holidays` page, not
a calendar grid — doesn't change the API shape, just context for why there's no "calendar view"
endpoint needed.

**Endpoints:**

| Endpoint | Method | Query/Body | RBAC action |
|---|---|---|---|
| `/holidays?year=` | GET | — | `holidays.view` (baseline for every role) |
| `/holidays` | POST | `Holiday` minus id | `holidays.add` |
| `/holidays/:id` | PATCH/DELETE | partial / — | `holidays.edit`/`.delete` |

---

## 19. Organization

No dedicated type exists — the current `/organization` page derives everything from the employee
list client-side (headcount, department breakdown, locations, designations), calling
`getEmployees()` directly rather than a separate service.

**Suggested endpoints** (aggregation, not new persisted entities):

| Endpoint | Method | Returns | RBAC action |
|---|---|---|---|
| `/organization/summary` | GET | `{ totalEmployees, byDepartment: [{department,count}], byLocation: [...], byLevel: [...] }` | `organization.view` |
| `/organization/departments` | GET | list of department names + head counts | `organization.view` |

`organization.add/edit/delete` exist in the matrix (for `super_admin`/`hr_admin`) but nothing in
the current UI calls them yet — likely reserved for an org-chart/department-management screen not
built yet. Don't over-build; a `Department` CRUD API is reasonable but low priority until the
frontend has a screen for it.

---

## 20. Reports

No dedicated type — the current `/reports` page is a **static catalog** of report definitions
(`REPORTS: ReportDef[]` — `id, name, module, description, lastGenerated`) with a "Download"
button per row. Nothing is actually generated yet.

**Suggested endpoints:**

| Endpoint | Method | Returns | RBAC action |
|---|---|---|---|
| `/reports` | GET | catalog of available reports | `reports.view` |
| `/reports/:id/generate` | POST | job id or direct file | `reports.export` | Each report (Headcount, Attendance Summary, Leave Utilization, Payroll Summary, etc.) pulls from the relevant module above — implement as simple aggregation queries; no new persisted data needed. |

---

## 21. Profile extras — Qualifications, Appraisals, Department Change

Three small self-service sub-tabs on the My Profile page:

**`QualificationEntry`** (`src/types/qualification.ts`): `id, type (10th Standard|12th Standard|
Graduation|Post Graduation|Certification), institution, board, period`

**`AppraisalEntry`** (`src/types/appraisal.ts`, read-only history): `id, cycle, rating,
ratingLabel, reviewedBy, date, status (Completed|In Progress|Scheduled), comments`

**`DepartmentChangeRequest`** (`src/types/department-change.ts`): `id, employeeId, employeeName,
currentDepartment, requestedDepartment, reason, status (Pending|Approved|Rejected), requestedOn`

**Endpoints:**

| Endpoint | Method | Query/Body | RBAC action |
|---|---|---|---|
| `/profile/me/qualifications` | GET/POST | — / `QualificationEntry` minus id | `documents.view`/`.add` (self-service, no dedicated module — reuse `documents` baseline permissions since this lives under the Documents-adjacent profile tab) |
| `/profile/me/qualifications/:id` | DELETE | — | own record only |
| `/profile/me/appraisals` | GET | — | `performance.view` (self) |
| `/department-change` | GET/POST | `scope=me\|all` / `{ requestedDepartment, reason }` | `organization.view`/`employees.add` (no dedicated module in the matrix — treat as an HR/organization concern; `hr_admin`/`super_admin` approve) |
| `/department-change/:id/approve` | POST | — | `organization.edit` |

These three don't map cleanly onto a single RBAC module in the current matrix — flagged
explicitly so you don't spend time hunting for a `qualifications` or `departmentChange` module key
that doesn't exist. Reuse the closest adjacent module's permissions as suggested above, or raise
adding dedicated module keys if that turns out cleaner on the backend side (would need a matching
frontend change to `src/types/rbac.ts` — coordinate before doing this).

---

## 22. Dashboard (aggregate feed)

**Type** (`src/types/dashboard.ts`) — one big `DashboardData` object combining slices of nearly
every other module: `stats[], employeeGrowth[], attendanceTrend[], leaveTrend[],
departmentDistribution[], todayAttendance[], upcomingBirthdays[], newJoinees[],
upcomingEvents[], upcomingHolidays[], pendingLeaveRequests[], recentActivity[],
announcements[]`.

There are **two different dashboards** in the frontend, chosen by role:

- **Admin/manager dashboard** — the full `DashboardData` object above.
- **Employee/special-employee self-service dashboard** (`EmployeeDashboard.tsx`) — a lighter
  view: greeting header, today's punch in/out, latest job openings, my recognition stats, new
  joinees, events, and an announcements feed. Reuses several of the same endpoints
  (`/attendance/me`, `/recognition/summary/:id`, `/announcements`, etc.) rather than needing a
  separate aggregate payload.

**Endpoint:**

| Endpoint | Method | Returns | RBAC action |
|---|---|---|---|
| `/dashboard` | GET | `DashboardData` (admin/manager) — trim server-side per role/scope | `dashboard.view` |

Treat this as a fan-out aggregation over the other modules' data (mostly read-only, cacheable per
role/employee) rather than a new source of truth — don't duplicate storage for anything already
modeled in §3–21.

---

## 23. Cross-cutting concerns

- **Scope-based authorization.** Several modules (`attendance`, `leave`, `dsr`, `expenses`,
  `performance`) are visible at three different scopes depending on role: **own** (employee sees
  only themselves), **team** (manager sees direct reports, resolved via `Employee.manager` name
  match — see §3), **company** (HR/admin/payroll roles see everyone). Build one shared
  `resolveVisibleEmployeeIds(user)` helper and reuse it across every scoped module's service layer
  rather than re-deriving scope logic per module.
- **Never trust client-submitted:** `role`, `employeeId`/`employeeName` on any create (always
  from the session), `net`/`gross` payroll totals (always server-computed from components),
  `status` transitions on approval workflows (always driven by a dedicated `/approve`/`/reject`
  endpoint, never a generic PATCH to an arbitrary status), `days` on a leave request (always
  computed from the date range), `dsrLoggedHours`/`remaining` leave balance (always computed, not
  stored+submitted).
- **Every mutating endpoint needs its own RBAC check** — don't rely on route-level middleware
  alone if the same route serves multiple scopes (e.g. `PATCH /leave/:id` behaves differently for
  "edit my own pending request" vs "HR editing anyone's request"); check both the action **and**
  scope inside the handler.
- **Pagination** — see the note in §0; apply the same envelope to every list endpoint above, not
  just the ones explicitly marked `page,pageSize`.
- **Errors** — use the envelope in §0; map common cases to HTTP status + `error.code`:
  `400 VALIDATION_ERROR`, `401 UNAUTHENTICATED`, `403 FORBIDDEN`, `404 NOT_FOUND`,
  `409 CONFLICT` (e.g. duplicate email on employee create).

---

## 24. Appendix: full default permission matrix

Seed the database with exactly this (`src/lib/rbac/permissions.ts` —
`DEFAULT_ROLE_PERMISSIONS`). Every role inherits a `SELF_SERVICE` baseline, then layers
role-specific grants on top:

```ts
const VIEW            = { view: true };
const VIEW_ADD         = { view: true, add: true };
const VIEW_ADD_EDIT    = { view: true, add: true, edit: true };
const FULL_NO_DELETE   = { view: true, add: true, edit: true, approve: true, reject: true, export: true };
const FULL             = { view: true, add: true, edit: true, delete: true, approve: true, reject: true, export: true, toggleStatus: true };

// Every role gets this baseline first, then the per-role block below layers on top of it.
const SELF_SERVICE = {
  dashboard: VIEW,
  employees: VIEW,       // directory visible to everyone; only add/edit/delete restricted
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

super_admin: {
  // FULL on every one of the 21 modules — the only role with roleAccess.edit by default
  // besides hr_admin's view-only grant.
  dashboard, employees, attendance, leave, payroll, recruitment, performance, training,
  documents, expenses, assets, peerRecognition, announcements, holidays, organization,
  reports, settings, roleAccess, dsr, projects, tickets: FULL,
}

hr_admin: {
  ...SELF_SERVICE,
  employees: FULL,
  attendance: FULL_NO_DELETE,
  leave: FULL_NO_DELETE,
  payroll: { view, add, edit, approve, export: true },
  recruitment: FULL,
  performance: { view, add, edit, approve: true },
  training: { view, add, edit, delete: true },
  documents: { view, add, edit, delete: true },
  expenses: FULL_NO_DELETE,
  assets: { view, add, edit, toggleStatus: true },
  announcements: { view, add, edit, delete: true },
  holidays: { view, add, edit, delete: true },
  organization: { view, add, edit, delete: true },
  reports: { view, export: true },
  settings: { view, edit: true },
  roleAccess: VIEW,
  dsr: { view, add, edit, approve: true },
  tickets: { view, add, edit, delete: true },
}

hr_executive: {
  ...SELF_SERVICE,
  employees: VIEW_ADD_EDIT,
  attendance: { view, add, edit, approve: true },
  leave: { view, add, approve, reject: true },
  performance: { view, edit: true },
  training: VIEW_ADD_EDIT,
  documents: { view, add, edit, delete: true },
  announcements: VIEW_ADD,
}

manager: {
  ...SELF_SERVICE,
  employees: VIEW,
  attendance: { view, add, approve: true },
  leave: { view, add, approve, reject: true },
  performance: { view, edit, approve: true },
  expenses: { view, add, approve, reject: true },
  reports: { view, export: true },
  dsr: { view, add, approve: true },
}

employee: {
  ...SELF_SERVICE,
  // nothing else — pure baseline
}

special_employee: {
  ...SELF_SERVICE,
  reports: VIEW,
  performance: VIEW_ADD_EDIT,
}

recruiter: {
  ...SELF_SERVICE,
  employees: VIEW,
  recruitment: FULL,
  reports: VIEW,
}

payroll_admin: {
  ...SELF_SERVICE,
  employees: VIEW,
  payroll: FULL_NO_DELETE,
  reports: { view, export: true },
}
```

The exact object literal lives in `src/lib/rbac/permissions.ts` if you want to copy-paste rather
than transcribe from this table — treat that file as canonical if this appendix and the code ever
drift.

---

## Seed accounts (for local dev/testing)

`src/services/auth.service.ts` — `MOCK_USERS`. Seed these exact identities (same emails) so
logging in during frontend integration behaves identically to today's mock:

| Email | Role | Name |
|---|---|---|
| vikram.mehta@hikeassociate.com | super_admin | Vikram Mehta |
| ananya.iyer@hikeassociate.com | hr_admin | Ananya Iyer |
| riya.kapoor@hikeassociate.com | hr_executive | Riya Kapoor |
| karan.malhotra@hikeassociate.com | manager | Karan Malhotra |
| aarav.sharma@hikeassociate.com | employee | Aarav Sharma |
| tanvi.shah@hikeassociate.com | special_employee | Tanvi Shah |
| simran.kaur@hikeassociate.com | recruiter | Simran Kaur |
| rohan.desai@hikeassociate.com | payroll_admin | Rohan Desai |

Pick any shared dev password (e.g. `Password123!`) — the mock never checked a real password
anyway.
