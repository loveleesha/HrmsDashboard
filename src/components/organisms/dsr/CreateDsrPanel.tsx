"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Plus, CircleDot } from "lucide-react";
import { FormField } from "@/components/molecules/FormField";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { DatePicker } from "@/components/molecules/DatePicker";
import { Input } from "@/components/atoms/Input";
import { Radio } from "@/components/atoms/Radio";
import { Textarea } from "@/components/atoms/Textarea";
import { Button } from "@/components/atoms/Button";
import { getMyDsrFormFields, normalizeHours } from "@/services/dsr.service";
import { listAllProjects } from "@/services/project.service";
import type { ApiProject } from "@/types/project";
import type { DsrFormField, SubmitDsrPayload } from "@/types/dsr";
import { cn } from "@/lib/cn";
import { textError, todayKey } from "@/lib/validation";
import { DurationPicker } from "@/components/molecules/DurationPicker";

/** Sentinel for the "Miscellaneous" choice in the project dropdown — never sent to the API. */
const OTHER = "__other__";

interface FormValues {
  /** A project id, OTHER, or "" (nothing chosen yet) — only meaningful (and
   * only rendered) when this role has a custom field literally named
   * "Project"; it's the real company-wide project picker, never a generic
   * text answer, so it keeps its own state instead of living in
   * customValues (see the dynamic fields loop below). */
  project: string;
  otherProject: string;
}

const EMPTY: FormValues = {
  project: "",
  otherProject: "",
};

export interface CreateDsrPanelProps {
  /** Resolves true once the DSR was saved (the form then resets). */
  onSubmit: (payload: SubmitDsrPayload) => Promise<boolean>;
}

export function CreateDsrPanel({ onSubmit }: CreateDsrPanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  // Admin-configured extra fields (DSR Form Builder — see DsrFormBuilder.tsx),
  // refetched every time the panel opens so a field added/changed by an admin
  // mid-session shows up without a full page reload.
  const [customFields, setCustomFields] = useState<DsrFormField[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  // Every created project, company-wide (not just ones this employee is
  // personally assigned to) — same listAllProjects every other project
  // picker in the DSR module uses, so the "Project" field offers the whole
  // company's project list to admins and employees alike.
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    let isMounted = true;
    getMyDsrFormFields().then((fields) => {
      if (!isMounted) return;
      setCustomFields(fields);
      // Pre-fill each field's admin-configured default — only for fields the
      // employee hasn't already typed something into (so re-opening the panel
      // mid-edit, e.g. after it auto-refetches, never clobbers their input).
      setCustomValues((prev) => {
        const next = { ...prev };
        for (const field of fields) {
          if (next[field.id] === undefined && field.defaultValue) next[field.id] = field.defaultValue;
        }
        return next;
      });
    });
    listAllProjects()
      .then((data) => isMounted && setProjects(data))
      .catch(() => {})
      .finally(() => isMounted && setProjectsLoading(false));
    return () => {
      isMounted = false;
    };
  }, [open]);

  // There's no "default" DSR form anymore — the whole submission experience
  // is driven by what the admin configured for this role via Customize
  // Form. A role with zero configured fields shows nothing and can't
  // submit (see the empty state below) rather than falling back to a
  // generic built-in form.
  const hasAnyCustomFields = customFields.length > 0;

  // Project and Description show ONLY when the admin explicitly configured
  // a custom field literally named that for this role — same as every other
  // field, there's no built-in fallback shown just because other fields
  // exist. "Project" keeps using the real company-wide project picker (not a
  // generic text box) from within the dynamic fields section below, still
  // writing to the same `project`/`otherProject` payload keys. When either
  // isn't configured, the backend's own requirement for it is satisfied
  // silently instead (project omitted — defaults to "Internal Project";
  // description gets a fixed placeholder) — same treatment as Date already
  // gets (auto-filled with today when this role's form doesn't collect it).
  const hasCustomProject = customFields.some((f) => f.label.trim().toLowerCase() === "project");
  const hasCustomDescription = customFields.some((f) => f.label.trim().toLowerCase() === "description");

  // Two separate admin-configured DSR forms can both apply to the same
  // employee — e.g. a field group created for "HR Admin" alone and another
  // for "HR Admin, HR Executive" together both include the "hr_admin" role,
  // so getMyDsrFormFields() legitimately returns a separate "Date"/"Project"/…
  // field *document* from each. Shown once per distinct label (the first
  // one returned) instead of once per document; the single value typed is
  // fanned back out to every underlying field id sharing that label at
  // submit time, so each document's own required check is still satisfied.
  const customFieldGroups = new Map<string, DsrFormField[]>();
  for (const field of customFields) {
    const key = field.label.trim().toLowerCase();
    const group = customFieldGroups.get(key);
    if (group) group.push(field);
    else customFieldGroups.set(key, [field]);
  }
  const dedupedCustomFields = Array.from(customFieldGroups.values()).map((group) => group[0]);

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function updateCustom(fieldId: string, value: string) {
    setCustomValues((prev) => ({ ...prev, [fieldId]: value }));
  }

  // The answer for one label's group of (possibly duplicate) custom field
  // documents — "Project" is special-cased to read the real project picker's
  // state instead of a generic customValues entry, since that's what
  // actually renders for it (see the dynamic fields loop below).
  function valueForGroup(group: DsrFormField[]): string {
    if (group[0].label.trim().toLowerCase() === "project") {
      if (!values.project) return "";
      if (values.project === OTHER) return values.otherProject.trim() || "Internal Project";
      return projects.find((p) => p.id === values.project)?.name ?? values.project;
    }
    return customValues[group[0].id]?.trim() ?? "";
  }

  async function handleAdd() {
    if (!hasAnyCustomFields) return;

    // Project is required only when this role's form actually has it
    // configured — otherwise there's no picker shown to fill it with at
    // all, and the payload just omits project/otherProject below (backend
    // defaults that to "Internal Project").
    if (hasCustomProject) {
      if (!values.project) return setError("Select one of your projects, or choose Miscellaneous.");
      const otherIssue = values.project === OTHER ? textError(values.otherProject, "Miscellaneous label", { max: 80 }) : undefined;
      if (otherIssue) return setError(otherIssue);
    }

    for (const group of customFieldGroups.values()) {
      const representative = group[0];
      const value = valueForGroup(group);
      // Required if ANY duplicate in the group is — a looser requirement on
      // one of them shouldn't let a stricter one slip through unanswered.
      if (group.some((f) => f.required) && !value) {
        return setError(`${representative.label} is required.`);
      }
      if (representative.type === "number" && value && Number.isNaN(Number(value))) {
        return setError(`${representative.label} must be a number.`);
      }
    }

    // date and aiToolsUsed are always required by the backend regardless of
    // whether this role's form collects them — fall back to today/false
    // when there's no custom "Date" field (or the employee left it blank).
    const dateGroup = customFieldGroups.get("date");
    const effectiveDate = (dateGroup ? valueForGroup(dateGroup) : "") || todayKey();
    const hoursGroup = customFieldGroups.get("estimated hours");
    const effectiveHours = hoursGroup ? valueForGroup(hoursGroup) : "";
    // description is also always required by the backend — when this role's
    // form doesn't collect it, a fixed placeholder satisfies that silently
    // rather than showing a text box nobody asked for.
    const descriptionGroup = customFieldGroups.get("description");
    const effectiveDescription = hasCustomDescription
      ? descriptionGroup
        ? valueForGroup(descriptionGroup)
        : ""
      : "No description provided for this role's DSR form.";
    if (hasCustomDescription && !effectiveDescription) return setError("Add a description of your work.");

    const payload: SubmitDsrPayload = {
      date: effectiveDate,
      ...(effectiveHours ? { estimatedHours: normalizeHours(effectiveHours) } : {}),
      noWorkDone: false,
      aiToolsUsed: false,
      description: effectiveDescription,
      // Omitted entirely when Project isn't part of this role's form (not ""
      // either way — a blank project would fail the backend's id validation;
      // omitting both keys just lets it default to "Internal Project").
      ...(hasCustomProject
        ? values.project === OTHER
          ? values.otherProject.trim()
            ? { otherProject: values.otherProject.trim() }
            : {}
          : { project: values.project }
        : {}),
    };

    payload.customFields = Array.from(customFieldGroups.values()).flatMap((group) => {
      const value = valueForGroup(group);
      return value ? group.map((field) => ({ fieldId: field.id, value })) : [];
    });

    setError(null);
    setIsSubmitting(true);
    try {
      if (await onSubmit(payload)) {
        setValues(EMPTY);
        setCustomValues({});
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
          {!hasAnyCustomFields ? (
            <p className="border-t border-border px-5 py-10 text-center text-fs-sm text-muted">
              No DSR fields have been configured for your role yet — contact your admin.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 border-t border-border p-5 sm:grid-cols-2">
                {dedupedCustomFields.map((field) => {
                  const normalizedLabel = field.label.trim().toLowerCase();
                  const isProjectField = normalizedLabel === "project";
                  const isDateField = normalizedLabel === "date";
                  const isHoursField = normalizedLabel === "estimated hours";
                  // Project and Description are always effectively required —
                  // the backend's top-level project/description payload keys
                  // are mandatory regardless of what the admin set this
                  // specific custom field document's own required flag to.
                  const required =
                    isProjectField || normalizedLabel === "description"
                      ? true
                      : (customFieldGroups.get(normalizedLabel) ?? [field]).some((f) => f.required);
                  return (
                    <FormField
                      key={field.id}
                      label={field.label}
                      htmlFor={`dsr-custom-${field.id}`}
                      required={required}
                      hint={
                        isProjectField && !projectsLoading && projects.length === 0
                          ? "No projects have been created yet — choose Miscellaneous."
                          : undefined
                      }
                      className={field.type === "textarea" || field.type === "radio" ? "sm:col-span-2" : undefined}
                    >
                      {isProjectField ? (
                        <div className="flex flex-col gap-2">
                          <FilterDropdown
                            label="Select project"
                            ariaLabel={field.label}
                            options={[...projects.map((p) => ({ label: p.name, value: p.id })), { label: "Miscellaneous", value: OTHER }]}
                            value={values.project}
                            onChange={(v) => update("project", v)}
                          />
                          {values.project === OTHER && (
                            <Input
                              placeholder="Miscellaneous work (optional) — e.g. Client onsite support"
                              value={values.otherProject}
                              onChange={(e) => update("otherProject", e.target.value)}
                            />
                          )}
                        </div>
                      ) : isDateField ? (
                        <DatePicker
                          id={`dsr-custom-${field.id}`}
                          value={customValues[field.id] ?? ""}
                          max={todayKey()}
                          onChange={(v) => updateCustom(field.id, v)}
                        />
                      ) : isHoursField ? (
                        <DurationPicker id={`dsr-custom-${field.id}`} value={customValues[field.id] ?? ""} onChange={(v) => updateCustom(field.id, v)} />
                      ) : field.type === "textarea" ? (
                        <Textarea
                          id={`dsr-custom-${field.id}`}
                          rows={4}
                          value={customValues[field.id] ?? ""}
                          onChange={(e) => updateCustom(field.id, e.target.value)}
                        />
                      ) : field.type === "dropdown" ? (
                        <FilterDropdown
                          label="Select"
                          ariaLabel={field.label}
                          options={field.options.map((o) => ({ label: o, value: o }))}
                          value={customValues[field.id] ?? ""}
                          onChange={(v) => updateCustom(field.id, v)}
                        />
                      ) : field.type === "radio" ? (
                        <div className="flex flex-wrap items-center gap-5">
                          {field.options.map((option) => (
                            <label key={option} className="flex items-center gap-2 text-fs-base text-ink">
                              <Radio
                                name={`dsr-custom-${field.id}`}
                                checked={customValues[field.id] === option}
                                onChange={() => updateCustom(field.id, option)}
                              />
                              {option}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <Input
                          id={`dsr-custom-${field.id}`}
                          type={field.type === "number" ? "number" : "text"}
                          value={customValues[field.id] ?? ""}
                          onChange={(e) => updateCustom(field.id, e.target.value)}
                        />
                      )}
                    </FormField>
                  );
                })}
              </div>
            </>
          )}

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
            <Button onClick={handleAdd} isLoading={isSubmitting} disabled={!hasAnyCustomFields}>
              <Plus className="size-4" />
              Add
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
