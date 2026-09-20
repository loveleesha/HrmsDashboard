"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { Table } from "@/components/molecules/Table";
import { FormField } from "@/components/molecules/FormField";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { useToast } from "@/hooks/use-toast";
import { addQualification } from "@/services/profile.service";
import { qualificationEntrySchema } from "@/schemas/onboarding.schema";
import { QUALIFICATION_TYPES, type QualificationEntry, type QualificationType } from "@/types/qualification";
import type { QualificationEntryDraft } from "@/types/onboarding";
import { cn } from "@/lib/cn";

const YEARS = Array.from({ length: 20 }, (_, i) => String(2026 - i));

function toDisplayEntry(q: QualificationEntryDraft): QualificationEntry {
  return {
    id: q.id,
    type: q.type as QualificationType,
    institution: q.institution,
    board: q.boardOrDegree,
    period: [q.startYear, q.endYear].filter(Boolean).join(" - "),
  };
}

export interface QualificationTabProps {
  /** The account's real, already-onboarded qualifications (from GET /api/user/profile). */
  initialQualifications: QualificationEntryDraft[];
}

export function QualificationTab({ initialQualifications }: QualificationTabProps) {
  const { showToast } = useToast();
  const [qualifications, setQualifications] = useState<QualificationEntryDraft[]>(initialQualifications);
  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [type, setType] = useState<QualificationType | "">("");
  const [institution, setInstitution] = useState("");
  const [board, setBoard] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [percentageOrGrade, setPercentageOrGrade] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function reset() {
    setType("");
    setInstitution("");
    setBoard("");
    setSpecialization("");
    setStartYear("");
    setEndYear("");
    setPercentageOrGrade("");
    setErrors({});
  }

  async function handleSave() {
    const result = qualificationEntrySchema.safeParse({
      type,
      institution,
      boardOrDegree: board,
      specialization,
      startYear,
      endYear,
      percentageOrGrade,
    });
    if (!result.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = String(issue.path[0]);
        if (!nextErrors[field]) nextErrors[field] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const profile = await addQualification({
        type: result.data.type,
        institution: result.data.institution,
        boardOrDegree: result.data.boardOrDegree,
        specialization: result.data.specialization || undefined,
        startYear: Number(result.data.startYear),
        endYear: Number(result.data.endYear),
        percentageOrGrade: result.data.percentageOrGrade || undefined,
      });
      setQualifications(profile.qualifications);
      reset();
      setFormOpen(false);
      showToast("Qualification added.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not add this qualification.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="mb-3 text-fs-xl font-semibold text-ink">Education Details</h3>
        <Table
          columns={[
            { key: "type", header: "Type", render: (q: QualificationEntry) => <span className="font-medium text-ink">{q.type}</span> },
            { key: "institution", header: "School / College / University", render: (q: QualificationEntry) => q.institution },
            { key: "board", header: "Board / Degree / Course", render: (q: QualificationEntry) => q.board },
            { key: "period", header: "Period", render: (q: QualificationEntry) => q.period },
          ]}
          data={qualifications.map(toDisplayEntry)}
          keyField={(q) => q.id}
          emptyMessage="No qualifications added yet."
        />
      </div>

      <div className="rounded-xl border border-border bg-surface-card">
        <button
          type="button"
          onClick={() => setFormOpen((prev) => !prev)}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <span className="flex items-center gap-2 text-fs-lg font-semibold text-ink">
            <Plus className="size-4 text-primary" />
            Add New Qualification
          </span>
          <ChevronDown className={cn("size-4 text-muted-light transition-transform", formOpen && "rotate-180")} />
        </button>

        {formOpen && (
          <div className="border-t border-border p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Qualification Type" htmlFor="qual-type" error={errors.type}>
                <FilterDropdown
                  label="Select Type"
                  options={QUALIFICATION_TYPES.map((t) => ({ label: t, value: t }))}
                  value={type}
                  onChange={(v) => setType(v as QualificationType)}
                />
              </FormField>
              <FormField label="School Name" htmlFor="qual-name" error={errors.institution}>
                <Input id="qual-name" placeholder="Name" value={institution} onChange={(e) => setInstitution(e.target.value)} />
              </FormField>
              <FormField label="Board / Degree" htmlFor="qual-board" error={errors.boardOrDegree}>
                <Input id="qual-board" placeholder="e.g. CBSE, ICSE, State Board" value={board} onChange={(e) => setBoard(e.target.value)} />
              </FormField>
              <FormField label="Specialization" htmlFor="qual-specialization">
                <Input id="qual-specialization" placeholder="Optional" value={specialization} onChange={(e) => setSpecialization(e.target.value)} />
              </FormField>
              <FormField label="Start Year" htmlFor="qual-start-year" error={errors.startYear}>
                <FilterDropdown label="Year" options={YEARS.map((y) => ({ label: y, value: y }))} value={startYear} onChange={setStartYear} />
              </FormField>
              <FormField label="Passing Year" htmlFor="qual-end-year" error={errors.endYear}>
                <FilterDropdown label="Year" options={YEARS.map((y) => ({ label: y, value: y }))} value={endYear} onChange={setEndYear} />
              </FormField>
              <FormField label="Percentage / Grade" htmlFor="qual-grade">
                <Input id="qual-grade" placeholder="Optional" value={percentageOrGrade} onChange={(e) => setPercentageOrGrade(e.target.value)} />
              </FormField>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleSave} isLoading={isSubmitting}>
                Save
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
