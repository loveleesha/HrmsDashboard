"use client";

import { useState } from "react";
import { ChevronDown, Plus, CircleDot } from "lucide-react";
import { FormField } from "@/components/molecules/FormField";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { DatePickerField } from "@/components/molecules/DatePickerField";
import { Input } from "@/components/atoms/Input";
import { Checkbox } from "@/components/atoms/Checkbox";
import { Radio } from "@/components/atoms/Radio";
import { Label } from "@/components/atoms/Label";
import { Textarea } from "@/components/atoms/Textarea";
import { Button } from "@/components/atoms/Button";
import { MOCK_PROJECTS } from "@/services/project.service";
import { cn } from "@/lib/cn";

export interface CreateDsrValues {
  project: string;
  date: string;
  estimatedHours: string;
  noWorkDone: boolean;
  usedAiTools: boolean;
  description: string;
}

const PROJECT_OPTIONS = MOCK_PROJECTS.map((p) => ({ label: p.name, value: p.name }));

const EMPTY: CreateDsrValues = {
  project: "",
  date: "",
  estimatedHours: "",
  noWorkDone: false,
  usedAiTools: false,
  description: "",
};

export function CreateDsrPanel({ onSubmit }: { onSubmit: (values: CreateDsrValues) => void }) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<CreateDsrValues>(EMPTY);
  const [usedAi, setUsedAi] = useState<"yes" | "no" | "">("");
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof CreateDsrValues>(key: K, value: CreateDsrValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleAdd() {
    if (!values.project) return setError("Select a project.");
    if (!values.date) return setError("Select a date.");
    if (!values.noWorkDone && !/^\d{1,2}:\d{2}$/.test(values.estimatedHours)) {
      return setError("Enter estimated hours as HH:MM.");
    }
    if (!usedAi) return setError("Let us know if you used AI tools today.");
    if (!values.description.trim()) return setError("Add a description of your work.");

    onSubmit({ ...values, estimatedHours: values.noWorkDone ? "00:00" : values.estimatedHours, usedAiTools: usedAi === "yes" });
    setValues(EMPTY);
    setUsedAi("");
    setError(null);
    setOpen(false);
  }

  return (
    <div className="mb-4 rounded-xl border border-border bg-surface-card">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <Plus className="size-4" />
          </span>
          <div>
            <p className="text-fs-lg font-semibold text-ink">Create New DSR</p>
            <p className="text-fs-sm text-muted">Submit your daily status report</p>
          </div>
        </div>
        <ChevronDown className={cn("size-5 shrink-0 text-muted-light transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="grid grid-cols-1 gap-4 border-t border-border p-5 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
              <FormField label="Project" htmlFor="dsr-project">
                <FilterDropdown label="Project" options={PROJECT_OPTIONS} value={values.project} onChange={(v) => update("project", v)} />
              </FormField>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DatePickerField label="Date" value={values.date} onChange={(e) => update("date", e.target.value)} />
                <FormField label="Estimated Hour" htmlFor="dsr-hours">
                  <Input
                    id="dsr-hours"
                    placeholder="HH:MM"
                    value={values.estimatedHours}
                    disabled={values.noWorkDone}
                    onChange={(e) => update("estimatedHours", e.target.value)}
                  />
                </FormField>
              </div>

              <label className="flex items-center gap-2 text-fs-base text-ink">
                <Checkbox checked={values.noWorkDone} onChange={(e) => update("noWorkDone", e.target.checked)} />
                No work done
              </label>

              <div>
                <Label className="mb-2 block">
                  Did you use AI tools today? <span className="text-danger">*</span>
                </Label>
                <div className="flex items-center gap-5">
                  <label className="flex items-center gap-2 text-fs-base text-ink">
                    <Radio name="used-ai" checked={usedAi === "yes"} onChange={() => setUsedAi("yes")} />
                    Yes
                  </label>
                  <label className="flex items-center gap-2 text-fs-base text-ink">
                    <Radio name="used-ai" checked={usedAi === "no"} onChange={() => setUsedAi("no")} />
                    No
                  </label>
                </div>
              </div>
            </div>

            <FormField label="Description" htmlFor="dsr-description">
              <Textarea
                id="dsr-description"
                rows={9}
                placeholder="Describe the work you did…"
                value={values.description}
                onChange={(e) => update("description", e.target.value)}
              />
            </FormField>
          </div>

          {error && (
            <p className="flex items-center gap-1.5 border-t border-border px-5 py-3 text-fs-sm text-danger">
              <CircleDot className="size-3.5" />
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>
              <Plus className="size-4" />
              Add
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
