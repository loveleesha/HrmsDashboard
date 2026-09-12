"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { GraduationCap, Pencil, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/molecules/Modal";
import { FormField } from "@/components/molecules/FormField";
import { FileUploadField } from "@/components/molecules/FileUploadField";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { qualificationEntrySchema } from "@/schemas/onboarding.schema";
import type { QualificationEntryDraft } from "@/types/onboarding";
import type { OnboardingStepHandle } from "@/components/organisms/onboarding/step-types";

export interface QualificationStepProps {
  value: QualificationEntryDraft[];
  onChange: (value: QualificationEntryDraft[]) => void;
}

type DraftForm = Omit<QualificationEntryDraft, "id">;

const EMPTY_FORM: DraftForm = {
  qualification: "",
  institution: "",
  specialization: "",
  passingYear: "",
  grade: "",
  certificateFileName: undefined,
};

export const QualificationStep = forwardRef<OnboardingStepHandle, QualificationStepProps>(function QualificationStep(
  { value, onChange },
  ref
) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DraftForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof DraftForm, string>>>({});

  useImperativeHandle(ref, () => ({
    validate: () => true,
  }));

  function openAddModal() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  }

  function openEditModal(entry: QualificationEntryDraft) {
    setEditingId(entry.id);
    setForm({
      qualification: entry.qualification,
      institution: entry.institution,
      specialization: entry.specialization ?? "",
      passingYear: entry.passingYear,
      grade: entry.grade ?? "",
      certificateFileName: entry.certificateFileName,
    });
    setErrors({});
    setModalOpen(true);
  }

  function handleDelete(id: string) {
    onChange(value.filter((entry) => entry.id !== id));
  }

  function handleSave() {
    const result = qualificationEntrySchema.safeParse(form);
    if (!result.success) {
      const nextErrors: Partial<Record<keyof DraftForm, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof DraftForm;
        if (!nextErrors[field]) nextErrors[field] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    if (editingId) {
      onChange(value.map((entry) => (entry.id === editingId ? { ...entry, ...result.data } : entry)));
    } else {
      onChange([...value, { id: `qual-${Date.now()}`, ...result.data }]);
    }
    setModalOpen(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-fs-3xl font-semibold text-ink">Qualification</h2>
          <p className="mt-1 text-fs-base text-muted">Add every academic qualification, most recent first.</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="size-4" />
          Add Qualification
        </Button>
      </div>

      {value.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface-card px-6 py-14 text-center">
          <GraduationCap className="size-6 text-muted-light" />
          <p className="text-fs-lg font-medium text-ink">No qualifications added yet</p>
          <p className="text-fs-base text-muted">Click &ldquo;Add Qualification&rdquo; to record education history.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {value.map((entry) => (
            <div key={entry.id} className="rounded-xl border border-border bg-surface-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-fs-lg font-semibold text-ink">{entry.qualification}</p>
                  <p className="text-fs-base text-muted">{entry.institution}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEditModal(entry)} aria-label="Edit qualification">
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(entry.id)} aria-label="Delete qualification">
                    <Trash2 className="size-4 text-danger" />
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-fs-sm text-muted">
                {entry.specialization && <span>{entry.specialization}</span>}
                <span>Passed {entry.passingYear}</span>
                {entry.grade && <span>{entry.grade}</span>}
                {entry.certificateFileName && <span className="text-ink">📎 {entry.certificateFileName}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Qualification" : "Add Qualification"}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>{editingId ? "Save Changes" : "Add Qualification"}</Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <FormField label="Qualification" htmlFor="qualification" required error={errors.qualification}>
            <Input
              id="qualification"
              value={form.qualification}
              onChange={(e) => setForm({ ...form, qualification: e.target.value })}
              invalid={Boolean(errors.qualification)}
              placeholder="e.g. B.Tech, MBA, 12th Standard"
            />
          </FormField>
          <FormField label="Institution" htmlFor="institution" required error={errors.institution}>
            <Input
              id="institution"
              value={form.institution}
              onChange={(e) => setForm({ ...form, institution: e.target.value })}
              invalid={Boolean(errors.institution)}
            />
          </FormField>
          <FormField label="Specialization" htmlFor="specialization" error={errors.specialization}>
            <Input
              id="specialization"
              value={form.specialization}
              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Passing Year" htmlFor="passingYear" required error={errors.passingYear}>
              <Input
                id="passingYear"
                value={form.passingYear}
                onChange={(e) => setForm({ ...form, passingYear: e.target.value })}
                invalid={Boolean(errors.passingYear)}
                placeholder="2022"
                maxLength={4}
              />
            </FormField>
            <FormField label="Percentage / Grade" htmlFor="grade" error={errors.grade}>
              <Input id="grade" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} placeholder="8.5 CGPA" />
            </FormField>
          </div>
          <FileUploadField
            label="Certificate Upload"
            accept="image/*,.pdf"
            value={form.certificateFileName ? { fileName: form.certificateFileName } : undefined}
            onChange={(file) => setForm({ ...form, certificateFileName: file?.fileName })}
          />
        </div>
      </Modal>
    </div>
  );
});
