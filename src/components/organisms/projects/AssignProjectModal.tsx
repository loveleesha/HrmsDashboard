"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/molecules/Modal";
import { FormField } from "@/components/molecules/FormField";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { Button } from "@/components/atoms/Button";
import { getEmployees } from "@/services/employee.service";
import { listProjects } from "@/services/project.service";
import type { Employee } from "@/types/employee";
import type { ApiProject } from "@/types/project";

export interface AssignProjectModalProps {
  onClose: () => void;
  onAssign: (params: { userId: string; projectId: string }) => Promise<boolean>;
}

/** Mounted only while open, so the employee/project pick-lists load once per open. */
export function AssignProjectModal({ onClose, onAssign }: AssignProjectModalProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [userId, setUserId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    Promise.all([getEmployees(), listProjects("active")])
      .then(([emps, projs]) => {
        if (!isMounted) return;
        setEmployees(emps);
        setProjects(projs);
      })
      .catch((err) => {
        if (isMounted) setError(err instanceof Error ? err.message : "Could not load employees and projects.");
      });
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit() {
    if (!userId || !projectId) {
      setError("Choose both an employee and a project.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onAssign({ userId, projectId });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Assign Project"
      description="Assign an active project to an employee."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            Assign
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="Employee" htmlFor="assignEmployee" required>
          <FilterDropdown
            label="Select employee"
            options={employees.map((e) => ({ label: e.employeeId ? `${e.name} (${e.employeeId})` : e.name, value: e.id }))}
            value={userId}
            onChange={setUserId}
          />
        </FormField>
        <FormField label="Project" htmlFor="assignProject" required>
          <FilterDropdown label="Select project" options={projects.map((p) => ({ label: p.name, value: p.id }))} value={projectId} onChange={setProjectId} />
        </FormField>
        {error && <p className="text-fs-sm text-danger">{error}</p>}
      </div>
    </Modal>
  );
}
