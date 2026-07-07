import { EmployeeRow } from '../domain/employee-row';
import { FieldChange } from '../domain/field-change';
import { EmployeeSnapshot } from '../domain/employee-snapshot.repository';

/**
 * The field-level diff a conflicting row would apply: current DB value → incoming
 * sheet value, one `FieldChange` per field that actually differs. `salaryTotal`
 * is compared in minor units and carries the incoming currency so HR can read it.
 */
export function computeChanges(
  existing: EmployeeSnapshot,
  row: EmployeeRow,
  incomingTotalMinor: number,
): FieldChange[] {
  return [
    attributeChange('firstName', existing.firstName, row.firstName),
    attributeChange('lastName', existing.lastName, row.lastName),
    attributeChange('department', existing.department, row.department),
    attributeChange('designation', existing.designation, row.designation),
    attributeChange('country', existing.country, row.country),
    attributeChange('currency', existing.currency, row.currency),
    attributeChange('joinDate', existing.joinDate, row.joinDate),
    salaryTotalChange(existing.salaryTotalMinor, incomingTotalMinor, row.currency),
  ].filter((change): change is FieldChange => change !== null);
}

function attributeChange(field: string, current: string, incoming: string): FieldChange | null {
  if (current === incoming) {
    return null;
  }
  return { field, current, incoming };
}

function salaryTotalChange(
  current: number,
  incoming: number,
  currency: string,
): FieldChange | null {
  if (current === incoming) {
    return null;
  }
  return { field: 'salaryTotal', current, incoming, currency };
}
