"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { Table } from "@/components/molecules/Table";
import { FormField } from "@/components/molecules/FormField";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { useToast } from "@/hooks/use-toast";
import { getMyQualifications, newQualificationId } from "@/services/qualification.service";
import { QUALIFICATION_TYPES, type QualificationEntry, type QualificationType } from "@/types/qualification";
import { cn } from "@/lib/cn";

const YEARS = Array.from({ length: 20 }, (_, i) => String(2026 - i));

export function QualificationTab() {
  const { showToast } = useToast();
  const [qualifications, setQualifications] = useState<QualificationEntry[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const [type, setType] = useState<QualificationType | "">("");
  const [institution, setInstitution] = useState("");
  const [board, setBoard] = useState("");
  const [year, setYear] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getMyQualifications().then((data) => {
      if (isMounted) setQualifications(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  function handleSave() {
    if (!type || !institution.trim() || !board.trim() || !year) {
      setError("Fill in all fields before saving.");
      return;
    }
    const entry: QualificationEntry = {
      id: newQualificationId(),
      type,
      institution: institution.trim(),
      board: board.trim(),
      period: year,
    };
    setQualifications((prev) => [...(prev ?? []), entry]);
    setType("");
    setInstitution("");
    setBoard("");
    setYear("");
    setError(null);
    setFormOpen(false);
    showToast("Qualification added.");
  }

  if (!qualifications) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted">
        <Spinner />
        Loading education details…
      </div>
    );
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
          data={qualifications}
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
              <FormField label="Qualification Type" htmlFor="qual-type">
                <FilterDropdown
                  label="Select Type"
                  options={QUALIFICATION_TYPES.map((t) => ({ label: t, value: t }))}
                  value={type}
                  onChange={(v) => setType(v as QualificationType)}
                />
              </FormField>
              <FormField label="School Name" htmlFor="qual-name">
                <Input id="qual-name" placeholder="Name" value={institution} onChange={(e) => setInstitution(e.target.value)} />
              </FormField>
              <FormField label="Board" htmlFor="qual-board">
                <Input id="qual-board" placeholder="e.g. CBSE, ICSE, State Board" value={board} onChange={(e) => setBoard(e.target.value)} />
              </FormField>
              <FormField label="Passing Year" htmlFor="qual-year">
                <FilterDropdown label="Year" options={YEARS.map((y) => ({ label: y, value: y }))} value={year} onChange={setYear} />
              </FormField>
            </div>
            {error && <p className="mt-3 text-fs-sm text-danger">{error}</p>}
            <div className="mt-4 flex justify-end">
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
