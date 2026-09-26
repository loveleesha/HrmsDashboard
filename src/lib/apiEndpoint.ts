/**
 * Single source of truth for every backend URL path used by the services in
 * `src/services/*`. Nothing outside this file should contain a literal
 * `"/api/..."` string — services import from here so a path only ever needs
 * to change in one place. Mirrors the "HRMS API" Postman collection's folder
 * layout (User / Admin) and endpoint order 1:1, so a given request in
 * Postman maps directly to one entry here.
 *
 * The host itself (baseURL) is configured separately, on the shared Axios
 * instance — see `src/lib/http/interceptor.ts` (`API_BASE_URL`).
 */

export const API_ENDPOINTS = {
  user: {
    // Auth
    register: "/api/user/register",
    login: "/api/user/login",
    forgotPassword: "/api/user/forgot-password",
    resetPassword: "/api/user/reset-password",
    changePassword: "/api/user/change-password",

    // Profile
    profile: "/api/user/profile",
    profilePicture: "/api/user/profile/picture",

    // Tickets
    tickets: "/api/user/tickets",
    ticketById: (id: string) => `/api/user/tickets/${id}`,
    ticketMessages: (id: string) => `/api/user/tickets/${id}/messages`,

    // DSR
    dsr: "/api/user/dsr",

    // My Projects
    projects: "/api/user/projects",

    // Training
    trainings: "/api/user/trainings",

    // Leave
    leaveBalance: "/api/user/leave/balance",
    leave: "/api/user/leave",
    leaveById: (id: string) => `/api/user/leave/${id}`,

    // Expenses
    expenses: "/api/user/expenses",
    expenseById: (id: string) => `/api/user/expenses/${id}`,

    // Assets
    assetRequests: "/api/user/assets/requests",
    assets: "/api/user/assets",

    // Documents
    documents: "/api/admin/documents", // shared read-only surface, see admin.documents
  },

  admin: {
    // Auth
    register: "/api/admin/register",
    login: "/api/admin/login",

    // Profile
    profile: "/api/admin/profile",

    // Roles
    roles: "/api/admin/roles",
    roleById: (id: string) => `/api/admin/roles/${id}`,

    // Admin Users (lightweight onboarding path)
    users: "/api/admin/users",
    userRole: (userId: string) => `/api/admin/users/${userId}/role`,

    // Onboarding Assets
    onboardingAssets: "/api/admin/employees/onboard/assets",

    // Onboarding (Step by Step)
    onboardingStep: (step: number) => `/api/admin/employees/onboard/step/${step}`,
    onboardingProgress: (userId: string) => `/api/admin/employees/onboard/progress/${userId}`,

    // Employees
    employees: "/api/admin/employees",
    employeeProfile: (userId: string) => `/api/admin/employees/${userId}/profile`,
    employeeStatus: (userId: string) => `/api/admin/employees/${userId}/status`,

    // Holidays
    holidays: "/api/admin/holidays",
    holidayById: (id: string) => `/api/admin/holidays/${id}`,

    // Departments
    departments: "/api/admin/departments",
    departmentById: (id: string) => `/api/admin/departments/${id}`,

    // Projects
    projects: "/api/admin/projects",
    projectById: (id: string) => `/api/admin/projects/${id}`,

    // Tickets
    tickets: "/api/admin/tickets",
    ticketById: (id: string) => `/api/admin/tickets/${id}`,
    ticketMessages: (id: string) => `/api/admin/tickets/${id}/messages`,
    ticketStatus: (id: string) => `/api/admin/tickets/${id}/status`,

    // DSR
    dsr: "/api/admin/dsr",

    // Project Assignments
    projectAssignments: "/api/admin/project-assignments",
    projectAssignmentById: (id: string) => `/api/admin/project-assignments/${id}`,

    // Training
    trainings: "/api/admin/trainings",
    trainingById: (id: string) => `/api/admin/trainings/${id}`,
    trainingStatus: (id: string) => `/api/admin/trainings/${id}/status`,
    trainingAttendance: (id: string) => `/api/admin/trainings/${id}/attendance`,

    // Leave (Team Approvals)
    leave: "/api/admin/leave",
    leaveById: (id: string) => `/api/admin/leave/${id}`,
    leaveStatus: (id: string) => `/api/admin/leave/${id}/status`,

    // Expenses
    expenses: "/api/admin/expenses",
    expenseById: (id: string) => `/api/admin/expenses/${id}`,
    expenseStatus: (id: string) => `/api/admin/expenses/${id}/status`,

    // Assets
    assets: "/api/admin/assets",
    assetById: (id: string) => `/api/admin/assets/${id}`,
    assetAssign: (id: string) => `/api/admin/assets/${id}/assign`,
    assetUnassign: (id: string) => `/api/admin/assets/${id}/unassign`,
    assetStatus: (id: string) => `/api/admin/assets/${id}/status`,
    assetRequests: "/api/admin/assets/requests",
    assetRequestStatus: (id: string) => `/api/admin/assets/requests/${id}/status`,

    // Documents
    documents: "/api/admin/documents",
    documentById: (id: string) => `/api/admin/documents/${id}`,
    documentDownload: (id: string) => `/api/admin/documents/${id}/download`,

    // Recruitment
    recruitmentStats: "/api/admin/recruitment/stats",
    recruitmentJobs: "/api/admin/recruitment/jobs",
    recruitmentJobById: (id: string) => `/api/admin/recruitment/jobs/${id}`,
    recruitmentJobStatus: (id: string) => `/api/admin/recruitment/jobs/${id}/status`,
    recruitmentCandidates: "/api/admin/recruitment/candidates",
    recruitmentCandidateById: (id: string) => `/api/admin/recruitment/candidates/${id}`,
    recruitmentCandidateStage: (id: string) => `/api/admin/recruitment/candidates/${id}/stage`,
    recruitmentInterviews: "/api/admin/recruitment/interviews",
    recruitmentInterviewById: (id: string) => `/api/admin/recruitment/interviews/${id}`,
    recruitmentInterviewStatus: (id: string) => `/api/admin/recruitment/interviews/${id}/status`,
  },
} as const;
