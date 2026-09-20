"use client";

import { useState } from "react";
import { Modal } from "@/components/molecules/Modal";
import { FormField } from "@/components/molecules/FormField";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { PasswordInput } from "@/components/molecules/PasswordInput";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { useRoles } from "@/hooks/use-roles";
import { useToast } from "@/hooks/use-toast";
import { assignAdminUserRole, createAdminUser, type AdminUserType } from "@/services/admin-user.service";
import { textError } from "@/lib/validation";

const USER_TYPE_OPTIONS: { label: string; value: AdminUserType }[] = [
  { label: "Admin", value: "admin" },
  { label: "HR", value: "hr" },
  { label: "Employee", value: "employee" },
];

export interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  /** Assigning a role needs roleAccess.edit — without it the role picker is hidden. */
  canAssignRole: boolean;
}

/**
 * Admin > Admin Users > Create User (+ optional Assign Role). The lightweight
 * alternative to the onboarding wizard — the account has no Employee record
 * (no profile, doesn't appear in the directory), just login + role.
 */
export function CreateUserModal({ open, onClose, canAssignRole }: CreateUserModalProps) {
  const { roles } = useRoles();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<string>("employee");
  const [roleId, setRoleId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function reset() {
    setName("");
    setEmail("");
    setPassword("");
    setUserType("employee");
    setRoleId("");
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!name.trim() || !email.trim() || !password) {
      setError("Name, email, and password are required.");
      return;
    }
    const nameIssue = textError(name, "Name", { min: 2, max: 80 });
    if (nameIssue) {
      setError(nameIssue);
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim()) || email.trim().length > 120) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const { userId, message } = await createAdminUser({
        name: name.trim(),
        email: email.trim(),
        password,
        userType: userType as AdminUserType,
      });
      if (roleId) {
        try {
          await assignAdminUserRole(userId, roleId);
          showToast(`${message} Role assigned.`);
        } catch (err) {
          showToast(`User created, but the role wasn't assigned: ${err instanceof Error ? err.message : "unknown error"}`, "error");
        }
      } else {
        showToast(message);
      }
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create this user.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create User"
      description="A login-only account. Use Add Employee for a full onboarding with profile and documents."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            Create User
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="Full Name" htmlFor="newUserName" required>
          <Input id="newUserName" value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label="Email" htmlFor="newUserEmail" required>
          <Input id="newUserEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </FormField>
        <FormField label="Password" htmlFor="newUserPassword" required>
          <PasswordInput id="newUserPassword" value={password} onChange={(e) => setPassword(e.target.value)} />
        </FormField>
        <FormField label="User Type" htmlFor="newUserType" hint="Admin → HR Admin, HR → HR Executive, Employee → Employee. Never Super Admin.">
          <FilterDropdown label="User Type" options={USER_TYPE_OPTIONS} value={userType} onChange={setUserType} />
        </FormField>
        {canAssignRole && (
          <FormField label="Role (optional)" htmlFor="newUserRole" hint="Overrides the role implied by the user type.">
            <FilterDropdown
              label="Keep default for user type"
              options={roles.map((r) => ({ label: r.label, value: r.id }))}
              value={roleId}
              onChange={setRoleId}
            />
          </FormField>
        )}
        {error && <p className="text-fs-sm text-danger">{error}</p>}
      </div>
    </Modal>
  );
}
