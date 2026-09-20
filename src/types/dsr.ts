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
  /** Only populated on Admin > DSR (employee is populated there). */
  employeeName?: string;
  employeeCode?: string;
  employeeEmail?: string;
  createdAt?: string;
  updatedAt?: string;
  /** Present only if the backend returns one — the collection has no approve/reject endpoint. */
  status?: string;
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
}
