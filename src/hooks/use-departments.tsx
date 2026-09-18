"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import * as departmentService from "@/services/department.service";
import type { ApiDepartment, CreateDepartmentPayload, UpdateDepartmentPayload } from "@/types/department";

interface DepartmentsContextValue {
  departments: ApiDepartment[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createDepartment: (payload: CreateDepartmentPayload) => Promise<ApiDepartment>;
  updateDepartment: (id: string, payload: UpdateDepartmentPayload) => Promise<ApiDepartment>;
  deleteDepartment: (id: string) => Promise<void>;
}

const DepartmentsContext = createContext<DepartmentsContextValue | undefined>(undefined);

export function DepartmentsProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [departments, setDepartments] = useState<ApiDepartment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await departmentService.listDepartments();
      setDepartments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load departments.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const createDepartment = useCallback(async (payload: CreateDepartmentPayload) => {
    const department = await departmentService.createDepartment(payload);
    setDepartments((prev) => [...prev, department]);
    return department;
  }, []);

  const updateDepartment = useCallback(async (id: string, payload: UpdateDepartmentPayload) => {
    const department = await departmentService.updateDepartment(id, payload);
    setDepartments((prev) => prev.map((d) => (d.id === id ? department : d)));
    return department;
  }, []);

  const deleteDepartment = useCallback(async (id: string) => {
    await departmentService.deleteDepartment(id);
    setDepartments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const value: DepartmentsContextValue = {
    departments,
    isLoading,
    error,
    refresh,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  };

  return <DepartmentsContext.Provider value={value}>{children}</DepartmentsContext.Provider>;
}

export function useDepartments() {
  const context = useContext(DepartmentsContext);
  if (!context) {
    throw new Error("useDepartments must be used within a DepartmentsProvider");
  }
  return context;
}
