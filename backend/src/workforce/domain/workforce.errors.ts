import { DuplicateError, FieldError, ValidationError } from 'src/platform';
import { ValidationReason } from './employee-validation';

/**
 * An employee code already exists in this organisation. A `DuplicateError` (409)
 * so the interface layer maps it to CONFLICT, with a field-level detail the
 * frontend form can pin to the `employeeCode` input.
 */
export class DuplicateEmployeeCodeError extends DuplicateError {
  constructor(employeeCode: string) {
    super(`Employee code ${employeeCode} already exists in this organisation.`, [
      { field: 'employeeCode', reason: 'duplicate' },
    ]);
  }
}

/**
 * One or more reference ids/codes (department, designation, country, currency)
 * did not resolve to a known record. A `ValidationError` (400) carrying the
 * offending fields so the form can highlight each bad dropdown selection.
 */
export class InvalidReferenceError extends ValidationError {
  constructor(fields: FieldError[]) {
    super('One or more reference values are unknown.', fields);
  }
}

/**
 * Maps a non-empty `EmployeeValidation` result to the most specific thrown error:
 * a duplicate code is a 409, unknown references are a typed 400, anything else is
 * a plain validation 400. Shared by create and update so both agree on status.
 */
export function raiseEmployeeValidation(employeeCode: string, errors: FieldError[]): never {
  if (errors.some((error) => error.reason === ValidationReason.Duplicate)) {
    throw new DuplicateEmployeeCodeError(employeeCode);
  }
  const references = errors.filter((error) => error.reason === ValidationReason.UnknownReference);
  if (references.length > 0) {
    throw new InvalidReferenceError(references);
  }
  throw new ValidationError('Employee details are invalid.', errors);
}
