"use client";

import type { ReactNode } from "react";
import { useAuthStore } from "@/store/auth.store";
import { login as loginRequest, logout as logoutRequest, type AuthAudience } from "@/services/auth.service";

/**
 * No context needed — zustand's store is already global. This wrapper exists
 * only so `<AuthProvider>` in the root layout keeps compiling; the session
 * itself rehydrates from localStorage via the store's `persist` middleware.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const isLoading = useAuthStore((state) => state.isLoading);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);

  async function login(email: string, password: string, audience: AuthAudience = "user") {
    const { user: loggedInUser, token: sessionToken, message } = await loginRequest(email, password, audience);
    setSession(loggedInUser, sessionToken);
    return { user: loggedInUser, message };
  }

  function logout() {
    logoutRequest();
    clearSession();
  }

  return { user, token, isLoading, login, logout };
}
