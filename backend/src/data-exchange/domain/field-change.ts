/**
 * One field of a conflicting row that an override would change: its `current`
 * value in the database versus the `incoming` value in the sheet. `currency` is
 * carried only for money fields (e.g. `salaryTotal`), where `current`/`incoming`
 * are integer minor units and HR needs the code to read the amount.
 */
export interface FieldChange {
  field: string;
  current: string | number | null;
  incoming: string | number;
  currency?: string;
}
