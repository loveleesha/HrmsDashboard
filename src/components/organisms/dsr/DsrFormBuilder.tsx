"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronDown, Pencil, Plus, Settings2, Trash2, X } from "lucide-react";
import { Popover } from "@/components/molecules/Popover";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Checkbox } from "@/components/atoms/Checkbox";
import { Switch } from "@/components/atoms/Switch";
import { Spinner } from "@/components/atoms/Spinner";
import { FilterDropdown } from "@/components/molecules/FilterDropdown";
import { ConfirmModal } from "@/components/molecules/ConfirmModal";
import { Table } from "@/components/molecules/Table";
import { useToast } from "@/hooks/use-toast";
import { addDsrFormField, deleteDsrFormField, getDsrFormFields, updateDsrFormField } from "@/services/dsr.service";
import { listRoles } from "@/services/role.service";
import { DSR_OPTIONS_FIELD_TYPES, type DsrFieldType, type DsrFormField } from "@/types/dsr";
import type { ApiRole } from "@/types/role";
import { cn } from "@/lib/cn";

function needsOptions(type: DsrFieldType): boolean {
  return DSR_OPTIONS_FIELD_TYPES.includes(type);
}

/** Order-independent identity for a set of role names — two fields created
 * together for the same role(s) share this key regardless of array order,
 * so the DSR Forms List can group them into one row instead of one row per
 * role (see the landing view below). */
function roleGroupKey(names: string[]): string {
  return [...names].sort().join("|");
}

/** "Employee, Manager" / "All Roles" / a single role's label — the same
 * join used for the "Creating a DSR form for X" line and the landing
 * table's "Role" column. */
function labelForRoleNames(names: string[], roles: ApiRole[]): string {
  if (names.length > 0 && roles.length > 0 && names.length === roles.length) return "All Roles";
  return names.map((name) => roles.find((r) => r.name === name)?.label ?? name).join(", ");
}

/** "Project", "Date", and "Estimated Hours" (by exact label, case-insensitive)
 * get a fixed employee-facing control instead of a plain text box — the real
 * assigned-projects picker, the calendar date picker, and the duration
 * picker respectively (see CreateDsrPanel.tsx). Since that mapping is keyed
 * purely by name and only exists for "input"/"string", their Field Type and
 * Field Data Type stay locked to that here so the picker can't accidentally
 * end up fed by a dropdown/radio/number field instead. */
function isPickerFieldLabel(label: string): boolean {
  const normalized = label.trim().toLowerCase();
  return normalized === "project" || normalized === "date" || normalized === "estimated hours";
}

/** The admin-facing "Field Type" — a presentation split of the single
 * DsrFieldType the backend actually stores: "Input" is either "text" or
 * "number" underneath depending on Field Data Type (see resolveFieldType /
 * splitFieldType below); the rest map straight across. */
type UiFieldType = "input" | "radio" | "dropdown" | "textarea";
const UI_FIELD_TYPE_OPTIONS: { label: string; value: UiFieldType }[] = [
  { label: "Input", value: "input" },
  { label: "Radio Button", value: "radio" },
  { label: "Dropdown", value: "dropdown" },
  { label: "Text Area", value: "textarea" },
];

type DataType = "string" | "number";
const DATA_TYPE_OPTIONS: { label: string; value: DataType }[] = [
  { label: "String", value: "string" },
  { label: "Number", value: "number" },
];

function resolveFieldType(fieldType: UiFieldType, dataType: DataType): DsrFieldType {
  if (fieldType === "input") return dataType === "number" ? "number" : "text";
  return fieldType;
}

function splitFieldType(type: DsrFieldType): { fieldType: UiFieldType; dataType: DataType } {
  if (type === "number") return { fieldType: "input", dataType: "number" };
  if (type === "text") return { fieldType: "input", dataType: "string" };
  return { fieldType: type, dataType: "string" };
}

/** Add/remove the fixed choice list a "radio"/"dropdown" field's answer must
 * be one of. `readOnly` drops the remove-button and the add-a-new-option row
 * — used for an already-saved field when the viewer lacks dsrForm.edit. */
function OptionsEditor({
  options,
  onChange,
  ariaLabel,
  readOnly,
}: {
  options: string[];
  onChange: (next: string[]) => void;
  ariaLabel: string;
  readOnly?: boolean;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const value = draft.trim();
    if (!value || options.includes(value)) return setDraft("");
    onChange([...options, value]);
    setDraft("");
  }

  return (
    <div aria-label={ariaLabel} className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-1.5">
        {options.length === 0 && <span className="text-fs-sm text-muted-light">No options yet — add at least one.</span>}
        {options.map((option) => (
          <span key={option} className="flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-fs-sm text-ink">
            {option}
            {!readOnly && (
              <button
                type="button"
                onClick={() => onChange(options.filter((o) => o !== option))}
                aria-label={`Remove option ${option}`}
                className="text-muted-light hover:text-danger"
              >
                <X className="size-3" />
              </button>
            )}
          </span>
        ))}
      </div>
      {!readOnly && (
        <div className="flex gap-2">
          <Input
            placeholder="Add an option"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              add();
            }}
            className="h-8 max-w-56"
          />
          <Button type="button" variant="secondary" size="sm" onClick={add}>
            <Plus className="size-3.5" />
            Add Option
          </Button>
        </div>
      )}
    </div>
  );
}

/** One row in the "add fields" drafts area — reused by both the "Create DSR
 * Form" flow and the "Update" (add more fields while editing a role) flow,
 * each passing its own patch/remove callbacks bound to its own drafts state. */
function DraftRowCard({
  draft,
  index,
  onPatch,
  onRemove,
  canRemove,
}: {
  draft: DraftRow;
  index: number;
  onPatch: (patch: Partial<DraftRow>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const locked = isPickerFieldLabel(draft.label);

  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-surface-card px-3 py-2.5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <label className="mb-1 block text-fs-sm text-muted">Field Name</label>
          <Input
            placeholder="e.g. Tickets Closed"
            value={draft.label}
            onChange={(e) => {
              const label = e.target.value;
              onPatch(
                isPickerFieldLabel(label) ? { label, fieldType: "input", dataType: "string", options: [] } : { label }
              );
            }}
          />
        </div>
        <div>
          <label className="mb-1 block text-fs-sm text-muted">Field Type</label>
          <FilterDropdown
            label="Field Type"
            options={UI_FIELD_TYPE_OPTIONS}
            value={draft.fieldType}
            onChange={(v) => onPatch({ fieldType: v as UiFieldType, options: [] })}
            disabled={locked}
            className="w-36"
          />
        </div>
        {draft.fieldType === "input" && (
          <div>
            <label className="mb-1 block text-fs-sm text-muted">Field Data Type</label>
            <FilterDropdown
              label="Data Type"
              options={DATA_TYPE_OPTIONS}
              value={draft.dataType}
              onChange={(v) => onPatch({ dataType: v as DataType })}
              disabled={locked}
              className="w-28"
            />
          </div>
        )}
        <label className="flex items-center gap-2 pb-2 text-fs-sm text-muted">
          <Switch checked={draft.required} onChange={(checked) => onPatch({ required: checked })} label={`Row ${index + 1} required`} />
          Required
        </label>
        {canRemove && (
          <Button variant="ghost" size="sm" onClick={onRemove} aria-label={`Remove row ${index + 1}`}>
            <Trash2 className="size-3.5 text-danger" />
          </Button>
        )}
      </div>

      {(draft.fieldType === "radio" || draft.fieldType === "dropdown") && (
        <div className="flex items-start gap-2 text-fs-sm text-muted">
          <span className="shrink-0 pt-1">Options</span>
          <OptionsEditor options={draft.options} onChange={(next) => onPatch({ options: next })} ariaLabel={`Row ${index + 1} options`} />
        </div>
      )}
    </div>
  );
}

/** One not-yet-saved row in the "add fields" section — `key` is local-only,
 * for React identity, never sent to the API. Nothing here hits the backend
 * until "Create DSR Form" is clicked — see DsrFormBuilder's handleCreateForm. */
interface DraftRow {
  key: string;
  label: string;
  fieldType: UiFieldType;
  dataType: DataType;
  required: boolean;
  options: string[];
}

function emptyDraftRow(): DraftRow {
  return { key: crypto.randomUUID(), label: "", fieldType: "input", dataType: "string", required: false, options: [] };
}

function defaultDraftRow(label: string, required: boolean): DraftRow {
  return { key: crypto.randomUUID(), label, fieldType: "input", dataType: "string", required, options: [] };
}

// "Create DSR Form" starts pre-loaded with these three common fields instead
// of one blank row — Project and Date are effectively always needed, and
// Estimated Hours is the other field almost every role's form ends up
// wanting, so admins get a usable form immediately and only need to add
// anything beyond these. Any of the three can still be renamed or removed
// like any other row before creating the form.
function defaultDraftRows(): DraftRow[] {
  return [defaultDraftRow("Project", true), defaultDraftRow("Date", true), defaultDraftRow("Estimated Hours", false)];
}

/** A dropdown that stays open across multiple picks — the trigger shows a
 * summary ("All Roles" / "Employee, Manager" / placeholder) and the panel is
 * a checkbox list, so several roles can be selected in one go instead of
 * reopening the dropdown per pick. */
function RoleMultiSelect({
  roles,
  selected,
  onChange,
  placeholder = "Select role(s)",
}: {
  roles: ApiRole[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const allSelected = roles.length > 0 && selected.length === roles.length;

  function toggle(name: string) {
    onChange(selected.includes(name) ? selected.filter((r) => r !== name) : [...selected, name]);
  }

  const summary = allSelected
    ? "All Roles"
    : selected.length === 0
      ? placeholder
      : roles
          .filter((r) => selected.includes(r.name))
          .map((r) => r.label)
          .join(", ");

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-lg border bg-surface-card px-3 text-left text-fs-lg transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-primary/30",
          open ? "border-primary" : "border-border hover:border-border-strong"
        )}
      >
        <span className={cn("truncate", selected.length > 0 ? "text-ink" : "text-muted-light")}>{summary}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-light" />
      </button>

      <Popover open={open} anchorRef={triggerRef} onClose={() => setOpen(false)} width={260} ariaLabel="Select roles">
        <div className="flex max-h-72 flex-col gap-0.5 overflow-y-auto">
          <button
            type="button"
            onClick={() => onChange(allSelected ? [] : roles.map((r) => r.name))}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-fs-base font-medium text-ink hover:bg-surface"
          >
            <Checkbox checked={allSelected} readOnly tabIndex={-1} />
            All Roles
          </button>
          <div className="my-1 border-t border-border" />
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => toggle(role.name)}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-fs-base text-ink hover:bg-surface"
            >
              <Checkbox checked={selected.includes(role.name)} readOnly tabIndex={-1} />
              {role.label}
            </button>
          ))}
        </div>
      </Popover>
    </div>
  );
}

/** First step of "+ Add Fields": pick one or more roles — the DSR fields
 * configured next are for that set. */
function RoleSelect({ roles, onBack, onContinue }: { roles: ApiRole[]; onBack: () => void; onContinue: (roleNames: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onBack} className="flex w-fit items-center gap-1.5 text-fs-sm font-medium text-primary hover:underline">
        <ArrowLeft className="size-3.5" />
        Back to list
      </button>
      <label className="text-fs-sm text-muted">Select the role(s) this DSR form is for</label>
      <RoleMultiSelect roles={roles} selected={selected} onChange={setSelected} />
      <Button onClick={() => onContinue(selected)} disabled={selected.length === 0} className="self-end">
        Continue
      </Button>
    </div>
  );
}

export interface DsrFormBuilderProps {
  /** Called after any add/edit/delete so the submission form's field list stays fresh. */
  onFieldsChanged?: () => void;
  /** Skip the summary-table landing view and open straight into "+ Add
   * Fields" (role select) — read once, on mount, so the caller forces a
   * fresh mount (e.g. a `key` bump) when it wants this to re-apply even if
   * this component's already showing. See dsr/page.tsx's header button vs.
   * clicking the "DSR Forms List" tab directly. */
  startInAddMode?: boolean;
  /** dsrForm.add — creating a new form (role-select → drafts) and adding
   * more rows to an existing role's form ("Add New Row"/"Update" inside
   * edit-role view). */
  canAdd: boolean;
  /** dsrForm.edit — every per-field control on an already-saved field
   * (type, data type, required, active, options, default value) renders
   * read-only without this. */
  canEdit: boolean;
  /** dsrForm.delete — the per-field Delete button and the landing table's
   * per-role-group Delete. */
  canDelete: boolean;
}

/** Admin > DSR > DSR Forms List tab — lists every configured field grouped
 * by role (edit/delete right there), plus a "+ Add Fields" sub-flow (pick
 * role(s) → configure new rows → Create DSR Form) for adding more. Rendered
 * only while its tab is active (see dsr/page.tsx), so a fresh mount is all
 * the "reset state when reopened" this needs — no open/close props. */
export function DsrFormBuilder({ onFieldsChanged, startInAddMode, canAdd, canEdit, canDelete }: DsrFormBuilderProps) {
  const { showToast } = useToast();
  const [fields, setFields] = useState<DsrFormField[] | null>(null);
  const [roles, setRoles] = useState<ApiRole[]>([]);
  // The "+ Add Fields" sub-flow: null everywhere = the list view. Picking
  // role(s) in RoleSelect sets `scope`, switching to the new-fields drafts.
  // `canAdd` guards this even if a caller somehow passes startInAddMode
  // without the permission to back it up — defense in depth alongside the
  // page-level gate on the "Customize Form" button itself.
  const [showRoleSelect, setShowRoleSelect] = useState(Boolean(startInAddMode) && canAdd);
  const [scope, setScope] = useState<string[] | null>(null);
  const [drafts, setDrafts] = useState<DraftRow[]>(() => defaultDraftRows());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DsrFormField | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // The landing view is a summary table — one row per distinct role
  // combination a form was created for (so a form made for "Employee,
  // Manager" together shows as one row, not two), each showing its field
  // count. Clicking a row's Edit opens just that combination's fields
  // (editable, same controls every field already has); clicking Delete
  // removes every field configured for it in one go.
  const [editingRoles, setEditingRoles] = useState<string[] | null>(null);
  const [deleteRoleTarget, setDeleteRoleTarget] = useState<{ roleNames: string[]; label: string } | null>(null);
  const [isDeletingRole, setIsDeletingRole] = useState(false);
  // New rows being added from inside the edit-role view (via its own "Add
  // New Row" / "Update") — separate from `drafts` above, which is the
  // "Create DSR Form" flow's own set and shouldn't be disturbed by this one.
  const [editDrafts, setEditDrafts] = useState<DraftRow[]>([]);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  // Last-saved default value per field, captured on focus — lets a failed save
  // roll the input back to what the server actually has, same as type/required.
  const savedDefaultRef = useRef<Record<string, string | null>>({});

  useEffect(() => {
    let isMounted = true;
    getDsrFormFields().then((data) => isMounted && setFields(data));
    listRoles()
      .then((data) => isMounted && setRoles(data))
      .catch(() => isMounted && showToast("Couldn't load the role list.", "error"));
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function patchLocal(id: string, patch: Partial<DsrFormField>) {
    setFields((prev) => (prev ?? []).map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function backToList() {
    setShowRoleSelect(false);
    setScope(null);
    setDrafts(defaultDraftRows());
    setEditingRoles(null);
    setEditDrafts([]);
  }

  function startEditingGroup(roleNames: string[]) {
    setEditingRoles(roleNames);
    setEditDrafts([]);
  }

  const scopeLabel = labelForRoleNames(scope ?? [], roles);

  async function handleTypeChange(field: DsrFormField, type: DsrFieldType) {
    const previous = field.type;
    const previousOptions = field.options;

    // Retyping TO radio/dropdown with no options yet can't save server-side
    // (it'd reject with "add at least one option") — reveal the options
    // editor locally instead, and let the first option added
    // (handleOptionsChange) commit the type change together with it.
    if (needsOptions(type) && field.options.length === 0) {
      patchLocal(field.id, { type });
      return;
    }

    patchLocal(field.id, { type });
    try {
      // A number-incompatible default gets dropped server-side on retype —
      // same for options that no longer apply — pick up whatever came back.
      const updated = await updateDsrFormField(field.id, { type });
      patchLocal(field.id, { defaultValue: updated.defaultValue, options: updated.options });
      onFieldsChanged?.();
    } catch (err) {
      patchLocal(field.id, { type: previous, options: previousOptions });
      showToast(err instanceof Error ? err.message : "Could not update this field's type.", "error");
    }
  }

  async function handleOptionsChange(field: DsrFormField, options: string[]) {
    const previousOptions = field.options;
    const previousType = field.type;
    const previousDefault = field.defaultValue;
    patchLocal(field.id, { options });
    try {
      // Always included — harmless when unchanged, and necessary to commit a
      // type change handleTypeChange deferred until options existed.
      const updated = await updateDsrFormField(field.id, { type: field.type, options });
      patchLocal(field.id, { type: updated.type, options: updated.options, defaultValue: updated.defaultValue });
      onFieldsChanged?.();
    } catch (err) {
      patchLocal(field.id, { options: previousOptions, type: previousType, defaultValue: previousDefault });
      showToast(err instanceof Error ? err.message : "Could not update this field's options.", "error");
    }
  }

  function handleDefaultValueSelect(field: DsrFormField, value: string) {
    const previous = field.defaultValue;
    const next = value || null;
    patchLocal(field.id, { defaultValue: next });
    updateDsrFormField(field.id, { defaultValue: next })
      .then(() => onFieldsChanged?.())
      .catch((err) => {
        patchLocal(field.id, { defaultValue: previous });
        showToast(err instanceof Error ? err.message : "Could not update this field's default.", "error");
      });
  }

  function handleDefaultValueFocus(field: DsrFormField) {
    savedDefaultRef.current[field.id] = field.defaultValue;
  }

  async function handleDefaultValueBlur(field: DsrFormField) {
    const previous = savedDefaultRef.current[field.id] ?? null;
    const current = field.defaultValue?.trim() || null;
    if (current === previous) return;
    if (field.type === "number" && current && Number.isNaN(Number(current))) {
      showToast(`${field.label}'s default must be a number.`, "error");
      patchLocal(field.id, { defaultValue: previous });
      return;
    }
    try {
      await updateDsrFormField(field.id, { defaultValue: current });
      savedDefaultRef.current[field.id] = current;
      onFieldsChanged?.();
    } catch (err) {
      patchLocal(field.id, { defaultValue: previous });
      showToast(err instanceof Error ? err.message : "Could not update this field's default.", "error");
    }
  }

  async function handleRequiredChange(field: DsrFormField, required: boolean) {
    patchLocal(field.id, { required });
    try {
      await updateDsrFormField(field.id, { required });
      onFieldsChanged?.();
    } catch (err) {
      patchLocal(field.id, { required: !required });
      showToast(err instanceof Error ? err.message : "Could not update this field.", "error");
    }
  }

  async function handleActiveChange(field: DsrFormField, isActive: boolean) {
    patchLocal(field.id, { isActive });
    try {
      await updateDsrFormField(field.id, { isActive });
      onFieldsChanged?.();
    } catch (err) {
      patchLocal(field.id, { isActive: !isActive });
      showToast(err instanceof Error ? err.message : "Could not update this field.", "error");
    }
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteDsrFormField(deleteTarget.id);
      setFields((prev) => (prev ?? []).filter((f) => f.id !== deleteTarget.id));
      onFieldsChanged?.();
      showToast(`Removed "${deleteTarget.label}".`);
      setDeleteTarget(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not remove this field.", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  // Deletes every field configured for exactly this role combination, one
  // at a time (no bulk endpoint). Matched by exact role-set, not "touches
  // any of these roles" — a field shared with a role outside this group
  // belongs to a different row/group and is left alone.
  async function handleDeleteRoleFormConfirmed() {
    if (!deleteRoleTarget) return;
    const targetKey = roleGroupKey(deleteRoleTarget.roleNames);
    const groupFields = (fields ?? []).filter((f) => roleGroupKey(f.applicableRoles) === targetKey);
    setIsDeletingRole(true);
    try {
      for (const field of groupFields) {
        await deleteDsrFormField(field.id);
      }
      setFields((prev) => (prev ?? []).filter((f) => roleGroupKey(f.applicableRoles) !== targetKey));
      onFieldsChanged?.();
      showToast(`Removed ${deleteRoleTarget.label}'s DSR form.`);
      setDeleteRoleTarget(null);
      if (editingRoles && roleGroupKey(editingRoles) === targetKey) setEditingRoles(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not remove this role's form.", "error");
    } finally {
      setIsDeletingRole(false);
    }
  }

  function patchDraft(key: string, patch: Partial<DraftRow>) {
    setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  }

  function addDraftRow() {
    setDrafts((prev) => [...prev, emptyDraftRow()]);
  }

  function removeDraftRow(key: string) {
    setDrafts((prev) => {
      const next = prev.filter((d) => d.key !== key);
      return next.length > 0 ? next : [emptyDraftRow()];
    });
  }

  /** One error string, or null if this draft is fine to submit — null is
   * also returned for a still-blank row (no label typed yet), which submit
   * silently skips. */
  function draftError(draft: DraftRow): string | null {
    if (!draft.label.trim()) return null;
    if ((draft.fieldType === "radio" || draft.fieldType === "dropdown") && draft.options.length === 0) {
      return `"${draft.label.trim()}" needs at least one option.`;
    }
    return null;
  }

  // "Create DSR Form" — validates every configured row, then submits them
  // all for the selected role(s). There's no bulk-create endpoint, so this
  // posts each row to the same single-field API the rest of the builder
  // already uses, one after another, under one button/one loading state —
  // then returns to the list view, which now includes the new fields.
  async function handleCreateForm() {
    if (!scope || scope.length === 0) return;
    const toCreate = drafts.filter((d) => d.label.trim());
    if (toCreate.length === 0) return showToast("Add at least one field before creating the form.", "error");

    for (const draft of toCreate) {
      const issue = draftError(draft);
      if (issue) return showToast(issue, "error");
    }

    setIsSubmitting(true);
    const created: DsrFormField[] = [];
    try {
      for (const draft of toCreate) {
        const field = await addDsrFormField({
          label: draft.label.trim(),
          type: resolveFieldType(draft.fieldType, draft.dataType),
          required: draft.required,
          options: draft.options,
          applicableRoles: scope,
        });
        created.push(field);
      }
      showToast(created.length === 1 ? "DSR form created — 1 field added." : `DSR form created — ${created.length} fields added.`);
      onFieldsChanged?.();
      setFields((prev) => [...(prev ?? []), ...created]);
      backToList();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not create the DSR form.", "error");
      if (created.length > 0) setFields((prev) => [...(prev ?? []), ...created]);
    } finally {
      setIsSubmitting(false);
    }
  }

  function patchEditDraft(key: string, patch: Partial<DraftRow>) {
    setEditDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  }

  function addEditDraftRow() {
    setEditDrafts((prev) => [...prev, emptyDraftRow()]);
  }

  function removeEditDraftRow(key: string) {
    setEditDrafts((prev) => prev.filter((d) => d.key !== key));
  }

  // "Update" — same one-row-at-a-time submission as "Create DSR Form", but
  // for rows added from inside the edit-role view: appends to the role
  // combination that's already being edited instead of a freshly picked
  // `scope`, and stays on this screen afterward instead of returning to the list.
  async function handleUpdateRole() {
    if (!editingRoles) return;
    const toCreate = editDrafts.filter((d) => d.label.trim());
    if (toCreate.length === 0) return showToast("Add at least one field before updating the form.", "error");

    for (const draft of toCreate) {
      const issue = draftError(draft);
      if (issue) return showToast(issue, "error");
    }

    setIsUpdatingRole(true);
    const created: DsrFormField[] = [];
    try {
      for (const draft of toCreate) {
        const field = await addDsrFormField({
          label: draft.label.trim(),
          type: resolveFieldType(draft.fieldType, draft.dataType),
          required: draft.required,
          options: draft.options,
          applicableRoles: editingRoles,
        });
        created.push(field);
      }
      showToast(created.length === 1 ? "1 field added." : `${created.length} fields added.`);
      onFieldsChanged?.();
      setFields((prev) => [...(prev ?? []), ...created]);
      setEditDrafts([]);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update this role's form.", "error");
      if (created.length > 0) setFields((prev) => [...(prev ?? []), ...created]);
    } finally {
      setIsUpdatingRole(false);
    }
  }

  function renderFieldRow(field: DsrFormField) {
    const parts = splitFieldType(field.type);
    const locked = isPickerFieldLabel(field.label);
    return (
      <div key={field.id} className="flex flex-col gap-2.5 rounded-lg border border-border px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="min-w-0 flex-1 truncate text-fs-base font-medium text-ink">{field.label}</span>
          <FilterDropdown
            label="Field Type"
            ariaLabel={`${field.label} field type`}
            options={UI_FIELD_TYPE_OPTIONS}
            value={parts.fieldType}
            onChange={(v) => handleTypeChange(field, resolveFieldType(v as UiFieldType, parts.dataType))}
            disabled={locked || !canEdit}
            className="w-36"
          />
          {parts.fieldType === "input" && (
            <FilterDropdown
              label="Data Type"
              ariaLabel={`${field.label} data type`}
              options={DATA_TYPE_OPTIONS}
              value={parts.dataType}
              onChange={(v) => handleTypeChange(field, resolveFieldType("input", v as DataType))}
              disabled={locked || !canEdit}
              className="w-28"
            />
          )}
          <label className="flex items-center gap-2 text-fs-sm text-muted">
            <Switch
              checked={field.required}
              onChange={(checked) => handleRequiredChange(field, checked)}
              label={`${field.label} required`}
              disabled={!canEdit}
            />
            {field.required ? "Required" : "Optional"}
          </label>
          <label className="flex items-center gap-2 text-fs-sm text-muted">
            <Switch
              checked={field.isActive}
              onChange={(checked) => handleActiveChange(field, checked)}
              label={`${field.label} active`}
              disabled={!canEdit}
            />
            {field.isActive ? "Active" : "Inactive"}
          </label>
          {canDelete && (
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(field)} aria-label={`Delete ${field.label}`}>
              <Trash2 className="size-3.5 text-danger" />
            </Button>
          )}
        </div>

        {needsOptions(field.type) && (
          <div className="flex items-start gap-2 text-fs-sm text-muted">
            <span className="shrink-0 pt-1">Options</span>
            <OptionsEditor
              options={field.options}
              onChange={(next) => handleOptionsChange(field, next)}
              ariaLabel={`${field.label} options`}
              readOnly={!canEdit}
            />
          </div>
        )}
        <label className="flex items-center gap-2 text-fs-sm text-muted">
          <span className="shrink-0">Default value</span>
          {needsOptions(field.type) ? (
            <FilterDropdown
              label="None"
              ariaLabel={`${field.label} default value`}
              options={[{ label: "None", value: "" }, ...field.options.map((o) => ({ label: o, value: o }))]}
              value={field.defaultValue ?? ""}
              onChange={(v) => handleDefaultValueSelect(field, v)}
              disabled={!canEdit}
              className="w-48"
            />
          ) : (
            <Input
              aria-label={`${field.label} default value`}
              placeholder="None — the field starts blank"
              type={field.type === "number" ? "number" : "text"}
              value={field.defaultValue ?? ""}
              disabled={!canEdit}
              onFocus={() => handleDefaultValueFocus(field)}
              onChange={(e) => patchLocal(field.id, { defaultValue: e.target.value })}
              onBlur={() => handleDefaultValueBlur(field)}
              className="h-8 flex-1"
            />
          )}
        </label>
      </div>
    );
  }

  const isLoading = !fields || roles.length === 0;

  return (
    <div className="rounded-xl border border-border bg-surface-card p-5">
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted">
          <Spinner />
          Loading…
        </div>
      ) : showRoleSelect && !scope ? (
        <RoleSelect roles={roles} onBack={() => setShowRoleSelect(false)} onContinue={setScope} />
      ) : scope ? (
        // New-fields drafts for the chosen role(s) — the list view (below)
        // already shows/edits everything already saved, so this section is
        // just about adding more.
        <div className="flex flex-col gap-4">
          <button type="button" onClick={backToList} className="flex w-fit items-center gap-1.5 text-fs-sm font-medium text-primary hover:underline">
            <ArrowLeft className="size-3.5" />
            Back to list
          </button>
          <p className="text-fs-sm text-muted">
            Creating a DSR form for <span className="font-medium text-ink">{scopeLabel}</span> — configure fields below, then click Create DSR
            Form.
          </p>

          <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-3">
            {drafts.map((draft, index) => (
              <DraftRowCard
                key={draft.key}
                draft={draft}
                index={index}
                onPatch={(patch) => patchDraft(draft.key, patch)}
                onRemove={() => removeDraftRow(draft.key)}
                canRemove={drafts.length > 1}
              />
            ))}

            <Button variant="secondary" size="sm" onClick={addDraftRow} className="self-start">
              <Plus className="size-4" />
              Add New Row
            </Button>
          </div>

          <Button onClick={handleCreateForm} isLoading={isSubmitting} className="self-end">
            Create DSR Form
          </Button>
        </div>
      ) : editingRoles ? (
        // Edit mode for one role combination — its existing fields (fully
        // editable, same controls every field already has, auto-saving per
        // change) plus a drafts area to add more without leaving this
        // screen: "Add New Row" appends a blank row here, "Update" submits
        // whatever's filled in.
        <div className="flex flex-col gap-4">
          <button type="button" onClick={backToList} className="flex w-fit items-center gap-1.5 text-fs-sm font-medium text-primary hover:underline">
            <ArrowLeft className="size-3.5" />
            Back to list
          </button>
          <h3 className="text-fs-xl font-semibold text-ink">
            {labelForRoleNames(editingRoles, roles)}
            <span className="ml-2 text-fs-sm font-normal text-muted-light">Editing fields</span>
          </h3>
          <div className="flex flex-col gap-2">
            {(fields ?? [])
              .filter((f) => roleGroupKey(f.applicableRoles) === roleGroupKey(editingRoles))
              .map((field) => renderFieldRow(field))}
          </div>

          {canAdd && editDrafts.length > 0 && (
            <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-3">
              {editDrafts.map((draft, index) => (
                <DraftRowCard
                  key={draft.key}
                  draft={draft}
                  index={index}
                  onPatch={(patch) => patchEditDraft(draft.key, patch)}
                  onRemove={() => removeEditDraftRow(draft.key)}
                  canRemove
                />
              ))}
            </div>
          )}

          {canAdd && (
            <div className="flex items-center justify-between">
              <Button variant="secondary" size="sm" onClick={addEditDraftRow}>
                <Plus className="size-4" />
                Add New Row
              </Button>
              {editDrafts.length > 0 && (
                <Button onClick={handleUpdateRole} isLoading={isUpdatingRole}>
                  Update
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        // Landing view — one row per distinct role combination a form was
        // created for (grouped by exact applicableRoles set, so a form made
        // for "Employee, Manager" together is one row, not two), showing its
        // field count; Edit opens that combination's fields, Delete removes
        // all of them.
        <div className="flex flex-col gap-5">
          <div>
            <h3 className="text-fs-xl font-semibold text-ink">Customize DSR Form</h3>
            <p className="text-fs-sm text-muted">
              Every role with configured fields — edit or remove its form. Use the &ldquo;Customize Form&rdquo; button above to create one for a new role.
            </p>
          </div>

          {(() => {
            const groups = new Map<string, { roleNames: string[]; count: number }>();
            for (const field of fields ?? []) {
              const key = roleGroupKey(field.applicableRoles);
              const existing = groups.get(key);
              if (existing) existing.count += 1;
              else groups.set(key, { roleNames: field.applicableRoles, count: 1 });
            }
            const rows = Array.from(groups.values());

            if (rows.length === 0) {
              return (
                <p className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-6 text-fs-sm text-muted">
                  <Settings2 className="size-4 shrink-0" />
                  {canAdd
                    ? 'No extra fields configured yet — use the "Customize Form" button above to create some.'
                    : "No extra fields configured yet."}
                </p>
              );
            }

            return (
              <Table
                columns={[
                  {
                    key: "role",
                    header: "Role",
                    render: (r) => <span className="font-medium text-ink">{labelForRoleNames(r.roleNames, roles)}</span>,
                  },
                  { key: "count", header: "Total Fields", render: (r) => r.count },
                  {
                    key: "actions",
                    header: "",
                    headerClassName: "w-32",
                    className: "text-right",
                    render: (r) => {
                      const label = labelForRoleNames(r.roleNames, roles);
                      return (
                        <div className="flex justify-end gap-2">
                          {canEdit && (
                            <Button variant="ghost" size="sm" onClick={() => startEditingGroup(r.roleNames)} aria-label={`Edit ${label}'s DSR form`}>
                              <Pencil className="size-3.5" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteRoleTarget({ roleNames: r.roleNames, label })}
                              aria-label={`Delete ${label}'s DSR form`}
                            >
                              <Trash2 className="size-3.5 text-danger" />
                            </Button>
                          )}
                        </div>
                      );
                    },
                  },
                ]}
                data={rows}
                keyField={(r) => roleGroupKey(r.roleNames)}
                pageSize={0}
              />
            );
          })()}
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirmed}
        title="Remove Field"
        description={deleteTarget?.label}
        body="Already-submitted DSRs keep their recorded answer for this field. Only new submissions stop showing it."
        confirmLabel="Remove Field"
        isConfirming={isDeleting}
      />

      <ConfirmModal
        open={Boolean(deleteRoleTarget)}
        onClose={() => setDeleteRoleTarget(null)}
        onConfirm={handleDeleteRoleFormConfirmed}
        title="Remove DSR Form"
        description={deleteRoleTarget?.label}
        body="Deletes every field configured for this role combination. Already-submitted DSRs keep their recorded answers regardless."
        confirmLabel="Remove Form"
        isConfirming={isDeletingRole}
      />
    </div>
  );
}
