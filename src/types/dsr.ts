/** An admin-configured extra input on the DSR form (see DsrFormField below),
 * as answered on one submitted entry — label/type are a snapshot taken at
 * submission time, so they stay accurate even if the field definition was
 * later renamed, retyped, or deleted. */
export interface DsrCustomFieldAnswer {
  fieldId?: string;
  label: string;
  type: DsrFieldType;
  value: string | number | null;
}

export interface DsrEntry {
  id: string;
  date: string;
  /** Display label: the project's name, or the free-text "other" label. */
  project: string;
  /** True when the entry isn't tied to a listed project. */
  isOtherProject: boolean;
  estimatedHours: string;
  noWorkDone: boolean;
  aiToolsUsed: boolean;
  description: string;
  customFields: DsrCustomFieldAnswer[];
  /** Only populated on Admin > DSR (employee is populated there). */
  employeeName?: string;
  employeeCode?: string;
  employeeEmail?: string;
  createdAt?: string;
  updatedAt?: string;
  /** Present only if the backend returns one — the collection has no approve/reject endpoint. */
  status?: string;
}

/** The DSR form builder's field types — "text" is the default a new field
 * starts as; an admin can change it to any other type. "radio"/"dropdown" are
 * backed by admin-defined `options` (see DsrFormField below); the rest take
 * free-text input. */
export type DsrFieldType = "text" | "number" | "textarea" | "radio" | "dropdown";

export const DSR_FIELD_TYPES: DsrFieldType[] = ["text", "number", "textarea", "radio", "dropdown"];

export const DSR_FIELD_TYPE_LABELS: Record<DsrFieldType, string> = {
  text: "Input",
  number: "Number",
  textarea: "Text Area",
  radio: "Radio Button",
  dropdown: "Dropdown",
};

/** Types whose answer must be one of an admin-defined list — see
 * DsrFormField.options. */
export const DSR_OPTIONS_FIELD_TYPES: DsrFieldType[] = ["radio", "dropdown"];

/** One admin-configured extra field on the DSR submission form — managed via
 * Admin > DSR > Customize Form, rendered dynamically below the fixed fields
 * on CreateDsrPanel. */
export interface DsrFormField {
  id: string;
  label: string;
  type: DsrFieldType;
  required: boolean;
  /** Pre-fills this field on the submission form; null/"" means no default.
   * For "radio"/"dropdown" this is one of `options`. */
  defaultValue: string | null;
  /** Only meaningful for "radio"/"dropdown" — the admin-defined choices an
   * answer must be one of. Empty for every other type. */
  options: string[];
  /** Role names (see ApiRole.name) this field is shown to — always non-empty;
   * there's no "applies to everyone" state, an admin always picks explicitly. */
  applicableRoles: string[];
  /** Deactivated fields stop showing up on anyone's submission form (and stop
   * being accepted/required there) without losing their configuration or any
   * already-submitted answers — a softer alternative to deleting. */
  isActive: boolean;
  order: number;
}

/**
 * Four cases (see the collection's Submit DSR requests):
 *  - With project: `project` = the Project's id, otherProject ignored.
 *  - Other, custom text: `project` omitted entirely (never ""), `otherProject` set.
 *  - Other, blank: both omitted — the server labels it "Internal Project".
 *  - No work done: `noWorkDone: true` skips description (and hours) entirely.
 * `aiToolsUsed` is always required.
 */
export interface SubmitDsrPayload {
  date: string;
  project?: string;
  otherProject?: string;
  estimatedHours?: string;
  noWorkDone: boolean;
  aiToolsUsed: boolean;
  description?: string;
  customFields?: { fieldId: string; value: string }[];
}
