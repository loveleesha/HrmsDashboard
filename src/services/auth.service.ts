import type { Role, User } from "@/types/user";

/**
 * Auth service — wired to the real HRMS backend (see the "Hrms Dashboard"
 * Postman collection, Auth Module). Every other module in this app is still
 * mock data; this is the first one wired to a live API.
 */

export const SESSION_COOKIE = "hrms_session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://backend-neon-phi-91.vercel.app";

const JWT_SHAPE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

/**
 * Cheap structural check (3 base64url segments), not a signature
 * verification — this only decides whether the session cookie is worth
 * trusting for route-gating in proxy.ts. Every real API call still sends
 * the token as-is and the backend is the one that actually verifies it.
 */
export function isJwtShaped(value: string): boolean {
  return JWT_SHAPE.test(value);
}

/**
 * Demo/simulation accounts used by unrelated mock features (Settings ->
 * Role & Access -> Assign Roles). Not read by the real login flow below —
 * kept only so those still-mocked screens keep working.
 */
export const MOCK_USERS: User[] = [
  {
    id: "u-1000",
    employeeId: "EMP-1000",
    name: "Vikram Mehta",
    email: "vikram.mehta@hikeassociate.com",
    role: "super_admin",
    designation: "Chief Executive Officer",
    department: "Leadership",
  },
  {
    id: "u-1021",
    employeeId: "EMP-1021",
    name: "Ananya Iyer",
    email: "ananya.iyer@hikeassociate.com",
    role: "hr_admin",
    designation: "HR Manager",
    department: "Human Resources",
  },
  {
    id: "u-1042",
    employeeId: "EMP-1042",
    name: "Riya Kapoor",
    email: "riya.kapoor@hikeassociate.com",
    role: "hr_executive",
    designation: "HR Executive",
    department: "Human Resources",
  },
  {
    id: "u-1015",
    employeeId: "EMP-1015",
    name: "Karan Malhotra",
    email: "karan.malhotra@hikeassociate.com",
    role: "manager",
    designation: "Engineering Manager",
    department: "Engineering",
  },
  {
    id: "u-1101",
    employeeId: "EMP-1101",
    name: "Aarav Sharma",
    email: "aarav.sharma@hikeassociate.com",
    role: "employee",
    designation: "Senior Software Engineer",
    department: "Engineering",
  },
  {
    id: "u-1033",
    employeeId: "EMP-1033",
    name: "Simran Kaur",
    email: "simran.kaur@hikeassociate.com",
    role: "recruiter",
    designation: "Talent Acquisition Specialist",
    department: "Recruitment",
  },
  {
    id: "u-1027",
    employeeId: "EMP-1027",
    name: "Rohan Desai",
    email: "rohan.desai@hikeassociate.com",
    role: "payroll_admin",
    designation: "Payroll Manager",
    department: "Finance",
  },
  {
    id: "u-1301",
    employeeId: "EMP-1301",
    name: "Tanvi Shah",
    email: "tanvi.shah@hikeassociate.com",
    role: "special_employee",
    designation: "DevOps Engineer",
    department: "Engineering",
  },
];

interface ApiUser {
  id?: string;
  _id?: string;
  name?: string;
  email: string;
  role: string;
  employeeId?: string;
  designation?: string;
  department?: string;
  avatarUrl?: string;
}

interface AuthResponse {
  token: string;
  user: ApiUser;
  message?: string;
}

interface RegisterResponse {
  user: ApiUser;
  message?: string;
}

interface MessageResponse {
  message?: string;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(body?.message ?? "Something went wrong. Please try again.", response.status);
  }

  return body as T;
}

/**
 * The real backend's role vocabulary (employee/hr/admin/super-admin, per the
 * collection's login test script) is coarser than this app's RBAC role set
 * (super_admin/hr_admin/hr_executive/manager/employee/special_employee/
 * recruiter/payroll_admin — see src/types/user.ts). Until the backend grows
 * matching granularity, unknown or narrower roles fall back to the closest
 * equivalent so RBAC has *something* valid to key off, rather than silently
 * denying every permission.
 */
const API_ROLE_MAP: Record<string, Role> = {
  "super-admin": "super_admin",
  superadmin: "super_admin",
  admin: "hr_admin",
  hr: "hr_executive",
  employee: "employee",
};

function mapApiRole(apiRole: string): Role {
  const mapped = API_ROLE_MAP[apiRole?.toLowerCase()];
  if (!mapped) {
    console.warn(`[auth] Unrecognized API role "${apiRole}" — defaulting to "employee".`);
    return "employee";
  }
  return mapped;
}

function mapApiUser(apiUser: ApiUser): User {
  const id = apiUser.id ?? apiUser._id ?? apiUser.email;
  return {
    id,
    employeeId: apiUser.employeeId ?? id,
    name: apiUser.name ?? apiUser.email,
    email: apiUser.email,
    role: mapApiRole(apiUser.role),
    designation: apiUser.designation ?? "",
    department: apiUser.department ?? "",
    avatarUrl: apiUser.avatarUrl,
  };
}

function setSessionCookie(token: string) {
  const maxAgeSeconds = 60 * 60 * 24 * 7;
  // Not httpOnly — this cookie only exists so the server-side proxy (see
  // src/proxy.ts) can gate routes; the actual bearer token used for API
  // calls lives in the zustand auth store (src/store/auth.store.ts).
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
}

function clearSessionCookie() {
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
}

export async function login(
  email: string,
  password: string
): Promise<{ user: User; token: string; message: string }> {
  const data = await apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setSessionCookie(data.token);
  return { user: mapApiUser(data.user), token: data.token, message: data.message ?? "Login successful." };
}

export function logout() {
  clearSessionCookie();
}

export type RegisterRole = "employee" | "hr" | "admin" | "super-admin";

export async function register(params: {
  name: string;
  email: string;
  password: string;
  role: RegisterRole;
}): Promise<{ user: User; message: string }> {
  const data = await apiRequest<RegisterResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(params),
  });
  return { user: mapApiUser(data.user), message: data.message ?? "Registration successful." };
}

export async function verifyOtp(
  email: string,
  otp: string
): Promise<{ user: User; token: string; message: string }> {
  const data = await apiRequest<AuthResponse>("/api/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });
  setSessionCookie(data.token);
  return { user: mapApiUser(data.user), token: data.token, message: data.message ?? "Account verified." };
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const data = await apiRequest<MessageResponse>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  return { message: data?.message ?? "If an account with that email exists, a password reset link has been sent." };
}

export async function resetPassword(params: {
  email: string;
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{ message: string }> {
  const data = await apiRequest<MessageResponse>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(params),
  });
  return { message: data?.message ?? "Password reset successfully." };
}

export async function changePassword(params: {
  token: string;
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{ message: string }> {
  const { token, ...body } = params;
  const data = await apiRequest<MessageResponse>("/api/auth/change-password", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return { message: data?.message ?? "Password updated successfully." };
}
