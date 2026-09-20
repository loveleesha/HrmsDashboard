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
import { useAssignedProjects } from "@/hooks/use-assigned-projects";
import { normalizeHours } from "@/services/dsr.service";
import type { SubmitDsrPayload } from "@/types/dsr";
import { cn } from "@/lib/cn";
import { hoursError, isFutureDate, textError, todayKey } from "@/lib/validation";
import { DurationPicker } from "@/components/molecules/DurationPicker";

/** Sentinel for the "Miscellaneous" choice in the project dropdown — never sent to the API. */
const OTHER = "__other__";

interface FormValues {
  /** A project id, OTHER, or "" (nothing chosen yet). */
  project: string;
  otherProject: string;
  date: string;
  estimatedHours: string;
  noWorkDone: boolean;
  description: string;
}

const EMPTY: FormValues = {
  project: "",
  otherProject: "",
  date: "",
  estimatedHours: "",
  noWorkDone: false,
  description: "",
};

export interface CreateDsrPanelProps {
  /** Resolves true once the DSR was saved (the form then resets). */
  onSubmit: (payload: SubmitDsrPayload) => Promise<boolean>;
}

export function CreateDsrPanel({ onSubmit }: CreateDsrPanelProps) {
  const { projects, isLoading: projectsLoading } = useAssignedProjects();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [usedAi, setUsedAi] = useState<"yes" | "no" | "">("");
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleAdd() {
    if (!values.date) return setError("Select a date.");
    if (isFutureDate(values.date)) return setError("A DSR can't be dated in the future.");
    if (!usedAi) return setError("Let us know if you used AI tools today.");

    let payload: SubmitDsrPayload;
    if (values.noWorkDone) {
      payload = { date: values.date, noWorkDone: true, aiToolsUsed: usedAi === "yes" };
    } else {
      if (!values.project) return setError("Select one of your projects, or choose Miscellaneous.");
      const hoursIssue = hoursError(values.estimatedHours);
      if (hoursIssue) return setError(hoursIssue);
      if (!values.description.trim()) return setError("Add a description of your work.");
      const descriptionIssue = textError(values.description, "Description", { min: 5, max: 2000 });
      if (descriptionIssue) return setError(descriptionIssue);
      const otherIssue = values.project === OTHER ? textError(values.otherProject, "Miscellaneous label", { max: 80 }) : undefined;
      if (otherIssue) return setError(otherIssue);
      payload = {
        date: values.date,
        estimatedHours: normalizeHours(values.estimatedHours),
        noWorkDone: false,
        aiToolsUsed: usedAi === "yes",
        description: values.description.trim(),
        // Omitted entirely (not "") for Miscellaneous: a blank project would fail the backend's id validation.
        ...(values.project === OTHER
          ? values.otherProject.trim()
            ? { otherProject: values.otherProject.trim() }
            : {}
          : { project: values.project }),
      };
    }

    setError(null);
    setIsSubmitting(true);
    try {
      if (await onSubmit(payload)) {
        setValues(EMPTY);
        setUsedAi("");
        setOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
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
              <FormField
                label="Project"
                htmlFor="dsr-project"
                hint={!projectsLoading && projects.length === 0 ? "You aren't assigned to any project yet — choose Miscellaneous." : undefined}
              >
                <FilterDropdown
                  label="Select project"
                  options={[...projects.map((p) => ({ label: p.name, value: p.id })), { label: "Miscellaneous", value: OTHER }]}
                  value={values.project}
                  onChange={(v) => update("project", v)}
                  className={cn(values.noWorkDone && "pointer-events-none opacity-50")}
                />
              </FormField>

              {values.project === OTHER && !values.noWorkDone && (
                <FormField label="Miscellaneous work (optional)" htmlFor="dsr-other-project" hint="What was it? Left blank, it's recorded as Internal Project.">
                  <Input
                    id="dsr-other-project"
                    placeholder="e.g. Client onsite support"
                    value={values.otherProject}
                    onChange={(e) => update("otherProject", e.target.value)}
                  />
                </FormField>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DatePickerField label="Date" value={values.date} max={todayKey()} onChange={(e) => update("date", e.target.value)} />
                <FormField label="Estimated Hours" htmlFor="dsr-hours" hint={values.noWorkDone ? undefined : "Type HH:MM or use the clock."}>
                  <DurationPicker
                    id="dsr-hours"
                    value={values.estimatedHours}
                    disabled={values.noWorkDone}
                    onChange={(next) => update("estimatedHours", next)}
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

            <FormField label="Description" htmlFor="dsr-description" hint={values.noWorkDone ? "Not needed when no work was done." : undefined}>
              <Textarea
                disabled={values.noWorkDone}
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
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleAdd} isLoading={isSubmitting}>
              <Plus className="size-4" />
              Add
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
