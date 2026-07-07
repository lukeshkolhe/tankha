import { FieldChange } from './field-change';

/**
 * A valid sheet row whose `employeeCode` already exists in the organisation.
 * Never overwritten silently: it is surfaced with the field-level `changes` an
 * override would apply so HR can decide, per row, whether to confirm it.
 */
export interface ConflictRow {
  rowNumber: number;
  employeeCode: string;
  changes: FieldChange[];
}
