import { FieldError } from 'src/platform';
import { SalaryComponentInput } from 'src/workforce/domain/employee-validation';
import { EmployeeRow } from '../domain/employee-row';

const REQUIRED_LABELS: Record<string, string> = {
  employeeCode: 'employee code',
  firstName: 'first name',
  lastName: 'last name',
  joinDate: 'join date',
};

/**
 * Turns the `FieldError[]` from the shared `EmployeeValidation` into the
 * plain-language reasons a `FailedRow` reports. Formatting only — the pass/fail
 * decision stays with `EmployeeValidation`; here the raw sheet values give the
 * message its context (e.g. the mistyped department name).
 */
export function describeValidationFailure(
  errors: FieldError[],
  row: EmployeeRow,
  components: SalaryComponentInput[],
): string[] {
  return unique(errors.flatMap((error) => describeError(error, row, components)));
}

/** The message for an in-file duplicate, kept here so both phases share it. */
export const DUPLICATE_IN_FILE_REASON = 'Duplicate employee code within the uploaded file';

function describeError(
  error: FieldError,
  row: EmployeeRow,
  components: SalaryComponentInput[],
): string[] {
  if (error.field === 'salary.components') {
    return describeSalary(error, components);
  }
  if (error.reason === 'unknownReference') {
    return [describeUnknownReference(error.field, row)];
  }
  if (error.reason === 'required') {
    return [`Missing required value for ${REQUIRED_LABELS[error.field] ?? error.field}`];
  }
  return [`Invalid value for ${REQUIRED_LABELS[error.field] ?? error.field}`];
}

function describeSalary(error: FieldError, components: SalaryComponentInput[]): string[] {
  if (error.reason === 'required') {
    return ['Salary components are required'];
  }
  return components
    .filter((component) => !isNonNegativeInteger(component.amountMinor))
    .map((component) => `Negative amount for ${component.type}`);
}

function describeUnknownReference(field: string, row: EmployeeRow): string {
  if (field === 'departmentId') return `Unknown department '${row.department}'`;
  if (field === 'designationId') return `Unknown designation '${row.designation}'`;
  if (field === 'countryCode') return `Unknown country '${row.country}'`;
  return `Unknown currency '${row.currency}'`;
}

function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
