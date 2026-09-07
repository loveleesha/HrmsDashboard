"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Role } from "@/types/user";
import { MOCK_USERS } from "@/services/auth.service";

const STORAGE_KEY = "hrms-role-assignments";

type Assignments = Record<string, Role>;

function defaultAssignments(): Assignments {
  const assignments: Assignments = {};
  MOCK_USERS.forEach((mockUser) => {
    assignments[mockUser.employeeId] = mockUser.role;
  });
  return assignments;
}

interface RoleAssignmentsContextValue {
  assignments: Assignments;
  getRole: (employeeId: string) => Role;
  setRole: (employeeId: string, role: Role) => void;
}

const RoleAssignmentsContext = createContext<RoleAssignmentsContextValue | undefined>(undefined);

export function RoleAssignmentsProvider({ children }: { children: ReactNode }) {
  const [assignments, setAssignments] = useState<Assignments>(defaultAssignments);

  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAssignments({ ...defaultAssignments(), ...JSON.parse(raw) });
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  const setRole = useCallback((employeeId: string, role: Role) => {
    setAssignments((prev) => {
      const next = { ...prev, [employeeId]: role };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const getRole = useCallback((employeeId: string) => assignments[employeeId] ?? "employee", [assignments]);

  return (
    <RoleAssignmentsContext.Provider value={{ assignments, getRole, setRole }}>
      {children}
    </RoleAssignmentsContext.Provider>
  );
}

export function useRoleAssignments() {
  const context = useContext(RoleAssignmentsContext);
  if (!context) {
    throw new Error("useRoleAssignments must be used within a RoleAssignmentsProvider");
  }
  return context;
}
