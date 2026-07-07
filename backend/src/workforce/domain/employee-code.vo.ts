import { ValidationError } from 'src/platform';

/**
 * An employee's HR-facing code (unique per organisation). Immutable and
 * self-validating: it is trimmed and rejected when blank at construction, so a
 * blank code can never flow into the aggregate. The uniqueness rule lives in
 * `EmployeeValidation` because it needs the persistence signal.
 */
export class EmployeeCode {
  private constructor(readonly value: string) {}

  static of(raw: string): EmployeeCode {
    const trimmed = (raw ?? '').trim();
    if (trimmed.length === 0) {
      throw new ValidationError('Employee code is required.', [
        { field: 'employeeCode', reason: 'required' },
      ]);
    }
    return new EmployeeCode(trimmed);
  }

  toString(): string {
    return this.value;
  }
}
