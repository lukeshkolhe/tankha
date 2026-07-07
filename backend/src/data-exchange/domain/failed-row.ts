/**
 * A sheet row rejected regardless of HR's choice: it failed validation or is a
 * duplicate of an earlier row in the same file. `reasons` are plain-language
 * messages the import report renders verbatim.
 */
export interface FailedRow {
  rowNumber: number;
  employeeCode?: string;
  reasons: string[];
}
