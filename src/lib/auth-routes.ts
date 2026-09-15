import type { AuthAudience } from "@/services/auth.service";

/**
 * Per-audience route map for every unauthenticated auth flow. The backend
 * splits login into /api/user/login vs /api/admin/login (see
 * auth.service.ts), so each flow gets a distinct frontend route per
 * audience too — forgot-password and reset-password call the same shared
 * backend endpoint either way (see the "HRMS API" collection's Change
 * Password note: "Works for {{adminToken}} accounts too"), but presenting
 * separate admin-branded pages keeps the whole auth experience consistent
 * with the login split.
 */
export const LOGIN_ROUTES: Record<AuthAudience, string> = {
  user: "/login",
  admin: "/admin/login",
};

export const FORGOT_PASSWORD_ROUTES: Record<AuthAudience, string> = {
  user: "/forgot-password",
  admin: "/admin/forgot-password",
};

export const RESET_PASSWORD_ROUTES: Record<AuthAudience, string> = {
  user: "/reset-password",
  admin: "/admin/reset-password",
};
