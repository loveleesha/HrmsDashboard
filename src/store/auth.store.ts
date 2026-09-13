import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/user";

interface AuthState {
  user: User | null;
  token: string | null;
  /** True until the persisted session (if any) has been read back from localStorage. */
  isLoading: boolean;
  setSession: (user: User, token: string) => void;
  clearSession: () => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: true,
      setSession: (user, token) => set({ user, token }),
      clearSession: () => set({ user: null, token: null }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: "hrms-auth",
      // Only persist the session itself — isLoading is a per-tab hydration
      // flag, not something that should ever be read back from storage.
      partialize: (state) => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => (state) => {
        state?.setLoading(false);
      },
    }
  )
);
