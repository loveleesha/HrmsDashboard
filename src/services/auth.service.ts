import { ROLES, type Role, type User } from "@/types/user";
import { httpService } from "@/lib/http/http.service";
import { setSessionCookie, clearSessionCookie } from "@/lib/session";

/**
 * Auth service — wired to the real HRMS backend (see the "Hrms Dashboard"
 * Postman collection, Auth Module). Every other module in this app is still
 * mock data; this is the first one wired to a live API.
 */

/**
 * Demo/simulation accounts used by an unrelated mock feature (Settings ->
 * Role & Access -> Assign Roles). Not read by the real login flow below.
 */
export const MOCK_USERS: User[] = [];

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

/**
 * The real backend's role vocabulary (see the "HRMS API" Postman collection —
 * User > Auth > Register's {{role}} and Admin > Auth > Register's
 * {{adminRole}}) already matches this app's RBAC role set one-for-one
 * (super_admin/hr_admin/hr_executive/manager/employee/special_employee/
 * recruiter/payroll_admin — see src/types/user.ts). Only a genuinely
 * unrecognized value (a role added backend-side that the frontend doesn't
 * know about yet) falls back, so RBAC has *something* valid to key off
 * rather than silently denying every permission.
 */
function mapApiRole(apiRole: string): Role {
  if ((ROLES as readonly string[]).includes(apiRole)) {
    return apiRole as Role;
  }
  console.warn(`[auth] Unrecognized API role "${apiRole}" — defaulting to "employee".`);
  return "employee";
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

/** The two audiences the "HRMS API" collection logs in separately: regular
 * users hit /api/user/login, admin-tier accounts hit /api/admin/login. */
export type AuthAudience = "user" | "admin";

const LOGIN_ENDPOINT: Record<AuthAudience, string> = {
  user: "/api/user/login",
  admin: "/api/admin/login",
};

export async function login(
  email: string,
  password: string,
  audience: AuthAudience = "user"
): Promise<{ user: User; token: string; message: string }> {
  const data = await httpService.post<AuthResponse>(LOGIN_ENDPOINT[audience], { email, password });
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
  const data = await httpService.post<RegisterResponse>("/api/auth/register", params);
  return { user: mapApiUser(data.user), message: data.message ?? "Registration successful." };
}

export async function verifyOtp(
  email: string,
  otp: string
): Promise<{ user: User; token: string; message: string }> {
  const data = await httpService.post<AuthResponse>("/api/auth/verify-otp", { email, otp });
  setSessionCookie(data.token);
  return { user: mapApiUser(data.user), token: data.token, message: data.message ?? "Account verified." };
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const data = await httpService.post<MessageResponse>("/api/auth/forgot-password", { email });
  return { message: data?.message ?? "If an account with that email exists, a password reset link has been sent." };
}

export async function resetPassword(params: {
  email: string;
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{ message: string }> {
  const data = await httpService.post<MessageResponse>("/api/auth/reset-password", params);
  return { message: data?.message ?? "Password reset successfully." };
}

/**
 * No token param — the shared Axios instance (src/lib/http/interceptor.ts)
 * attaches the current session's Bearer token to every request automatically.
 */
export async function changePassword(params: {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{ message: string }> {
  const data = await httpService.post<MessageResponse>("/api/auth/change-password", params);
  return { message: data?.message ?? "Password updated successfully." };
}
