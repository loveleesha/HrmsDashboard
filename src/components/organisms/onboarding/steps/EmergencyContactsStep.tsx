"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { Pencil, Phone, Plus, ShieldAlert, Star, Trash2 } from "lucide-react";
import { Modal } from "@/components/molecules/Modal";
import { FormField } from "@/components/molecules/FormField";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { emergencyContactSchema } from "@/schemas/onboarding.schema";
import { MAX_EMERGENCY_CONTACTS, type EmergencyContactDraft } from "@/types/onboarding";
import type { OnboardingStepHandle } from "@/components/organisms/onboarding/step-types";

export interface EmergencyContactsStepProps {
  value: EmergencyContactDraft[];
  onChange: (value: EmergencyContactDraft[]) => void;
}

type DraftForm = Omit<EmergencyContactDraft, "id" | "isPrimary">;

const EMPTY_FORM: DraftForm = { name: "", relationship: "", mobile: "", email: "", address: "" };

export const EmergencyContactsStep = forwardRef<OnboardingStepHandle, EmergencyContactsStepProps>(
  function EmergencyContactsStep({ value, onChange }, ref) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<DraftForm>(EMPTY_FORM);
    const [errors, setErrors] = useState<Partial<Record<keyof DraftForm, string>>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [listError, setListError] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      validate: () => {
        if (value.length === 0) {
          setListError("Add at least one emergency contact before continuing.");
          return false;
        }
        setListError(null);
        return true;
      },
    }));

    function openAddModal() {
      setEditingId(null);
      setForm(EMPTY_FORM);
      setErrors({});
      setFormError(null);
      setModalOpen(true);
    }

    function openEditModal(entry: EmergencyContactDraft) {
      setEditingId(entry.id);
      setForm({
        name: entry.name,
        relationship: entry.relationship,
        mobile: entry.mobile,
        email: entry.email ?? "",
        address: entry.address ?? "",
      });
      setErrors({});
      setFormError(null);
      setModalOpen(true);
    }

    function handleDelete(id: string) {
      const remaining = value.filter((entry) => entry.id !== id);
      const removedWasPrimary = value.find((entry) => entry.id === id)?.isPrimary;
      if (removedWasPrimary && remaining.length > 0) {
        remaining[0] = { ...remaining[0], isPrimary: true };
      }
      onChange(remaining);
    }

    function handleSetPrimary(id: string) {
      onChange(value.map((entry) => ({ ...entry, isPrimary: entry.id === id })));
    }

    function handleSave() {
      const result = emergencyContactSchema.safeParse({ ...form, isPrimary: false });
      if (!result.success) {
        const nextErrors: Partial<Record<keyof DraftForm, string>> = {};
        for (const issue of result.error.issues) {
          const field = issue.path[0] as keyof DraftForm;
          if (!nextErrors[field]) nextErrors[field] = issue.message;
        }
        setErrors(nextErrors);
        return;
      }

      const normalizedMobile = form.mobile.trim();
      const normalizedEmail = form.email?.trim().toLowerCase();
      const isDuplicate = value.some((entry) => {
        if (entry.id === editingId) return false;
        const mobileMatches = entry.mobile.trim() === normalizedMobile;
        const emailMatches = normalizedEmail && entry.email?.trim().toLowerCase() === normalizedEmail;
        return mobileMatches || emailMatches;
      });
      if (isDuplicate) {
        setFormError("Another emergency contact already uses this mobile number or email.");
        return;
      }

      if (editingId) {
        onChange(value.map((entry) => (entry.id === editingId ? { ...entry, ...result.data, isPrimary: entry.isPrimary } : entry)));
      } else {
        if (value.length >= MAX_EMERGENCY_CONTACTS) {
          setFormError(`You can add up to ${MAX_EMERGENCY_CONTACTS} emergency contacts.`);
          return;
        }
        const isPrimary = value.length === 0;
        onChange([...value, { id: `ec-${Date.now()}`, ...result.data, isPrimary }]);
      }
      setModalOpen(false);
      setListError(null);
    }

    const canAddMore = value.length < MAX_EMERGENCY_CONTACTS;

    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-fs-3xl font-semibold text-ink">Emergency Contacts</h2>
            <p className="mt-1 text-fs-base text-muted">
              Add up to {MAX_EMERGENCY_CONTACTS} contacts. At least one is required, and exactly one must be
              marked Primary.
            </p>
          </div>
          <Button onClick={openAddModal} disabled={!canAddMore}>
            <Plus className="size-4" />
            Add Emergency Contact
          </Button>
        </div>

        {value.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface-card px-6 py-14 text-center">
            <ShieldAlert className="size-6 text-muted-light" />
            <p className="text-fs-lg font-medium text-ink">No emergency contacts yet</p>
            <p className="text-fs-base text-muted">At least one contact is required to continue.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {value.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-border bg-surface-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="flex items-center gap-2 text-fs-lg font-semibold text-ink">
                      {entry.name}
                      {entry.isPrimary && (
                        <Badge tone="primary" className="gap-1">
                          <Star className="size-3" />
                          Primary
                        </Badge>
                      )}
                    </p>
                    <p className="text-fs-base text-muted">{entry.relationship}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(entry)} aria-label="Edit contact">
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(entry.id)} aria-label="Delete contact">
                      <Trash2 className="size-4 text-danger" />
                    </Button>
                  </div>
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-fs-sm text-muted">
                  <Phone className="size-3.5" />
                  {entry.mobile}
                </p>
                {entry.email && <p className="mt-1 text-fs-sm text-muted">{entry.email}</p>}
                {!entry.isPrimary && (
                  <Button variant="link" size="sm" className="mt-2" onClick={() => handleSetPrimary(entry.id)}>
                    Set as Primary
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
        {listError && <p className="text-fs-sm text-danger">{listError}</p>}

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingId ? "Edit Emergency Contact" : "Add Emergency Contact"}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>{editingId ? "Save Changes" : "Add Contact"}</Button>
            </div>
          }
        >
          <div className="flex flex-col gap-4">
            <FormField label="Name" htmlFor="ecName" required error={errors.name}>
              <Input id="ecName" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} invalid={Boolean(errors.name)} />
            </FormField>
            <FormField label="Relationship" htmlFor="ecRelationship" required error={errors.relationship}>
              <Input
                id="ecRelationship"
                value={form.relationship}
                onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                invalid={Boolean(errors.relationship)}
                placeholder="e.g. Father, Spouse, Sibling"
              />
            </FormField>
            <FormField label="Mobile Number" htmlFor="ecMobile" required error={errors.mobile}>
              <Input id="ecMobile" type="tel" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} invalid={Boolean(errors.mobile)} />
            </FormField>
            <FormField label="Email" htmlFor="ecEmail" error={errors.email}>
              <Input id="ecEmail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} invalid={Boolean(errors.email)} />
            </FormField>
            <FormField label="Address" htmlFor="ecAddress" error={errors.address}>
              <Input id="ecAddress" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </FormField>
            {formError && <p className="text-fs-sm text-danger">{formError}</p>}
          </div>
        </Modal>
      </div>
    );
  }
);
