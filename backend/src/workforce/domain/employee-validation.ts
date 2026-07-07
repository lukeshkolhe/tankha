import { SalaryComponentType } from '@prisma/client';
import { FieldError } from 'src/platform';
import { ValidReferences } from './reference.repository';

/** A component line as validated before it becomes a compensation write. */
export interface SalaryComponentInput {
  type: SalaryComponentType;
  amountMinor: number;
}

/**
 * The attributes an employee row must satisfy. `salaryComponents` is optional so
 * the same rule set serves create/import (salary present) and attribute-only
 * edits (salary omitted, since salary flows through `compensation`).
 */
export interface EmployeeValidationInput {
  employeeCode: string;
  firstName: string;
  lastName: string;
  departmentId: string;
  designationId: string;
  countryCode: string;
  currencyCode: string;
  joinDate: string;
  salaryComponents?: SalaryComponentInput[];
}

/** The reasons `EmployeeValidation` can attach to a field. */
export const ValidationReason = {
  Required: 'required',
  UnknownReference: 'unknownReference',
  Negative: 'negative',
  Invalid: 'invalid',
  Duplicate: 'duplicate',
} as const;

/**
 * THE single, pure employee rule set — shared verbatim by `CreateEmployeeUseCase`
 * and the importer so manual entry and bulk import can never disagree about what
 * "valid" means. It reads nothing and writes nothing: it takes the parsed
 * attributes, the set of valid reference ids/codes, and whether the code already
 * exists, and returns a list of `FieldError` (empty = valid).
 */
export class EmployeeValidation {
  static validate(
    input: EmployeeValidationInput,
    references: ValidReferences,
    codeAlreadyExists: boolean,
  ): FieldError[] {
    return [
      ...this.checkRequired(input),
      ...this.checkReferences(input, references),
      ...this.checkSalary(input),
      ...this.checkDuplicate(codeAlreadyExists),
    ];
  }

  private static checkRequired(input: EmployeeValidationInput): FieldError[] {
    const fields: Array<keyof EmployeeValidationInput> = [
      'employeeCode',
      'firstName',
      'lastName',
      'joinDate',
    ];
    return fields
      .filter((field) => isBlank(input[field]))
      .map((field) => ({ field, reason: ValidationReason.Required }));
  }

  private static checkReferences(
    input: EmployeeValidationInput,
    references: ValidReferences,
  ): FieldError[] {
    const checks: Array<[keyof EmployeeValidationInput, ReadonlySet<string>]> = [
      ['departmentId', references.departmentIds],
      ['designationId', references.designationIds],
      ['countryCode', references.countryCodes],
      ['currencyCode', references.currencyCodes],
    ];
    return checks
      .filter(([field, valid]) => !isBlank(input[field]) && !valid.has(String(input[field])))
      .map(([field]) => ({ field, reason: ValidationReason.UnknownReference }));
  }

  private static checkSalary(input: EmployeeValidationInput): FieldError[] {
    if (input.salaryComponents === undefined) {
      return [];
    }
    if (input.salaryComponents.length === 0) {
      return [{ field: 'salary.components', reason: ValidationReason.Required }];
    }
    return input.salaryComponents
      .filter((component) => !isNonNegativeInteger(component.amountMinor))
      .map(() => ({ field: 'salary.components', reason: ValidationReason.Negative }));
  }

  private static checkDuplicate(codeAlreadyExists: boolean): FieldError[] {
    if (!codeAlreadyExists) {
      return [];
    }
    return [{ field: 'employeeCode', reason: ValidationReason.Duplicate }];
  }
}

function isBlank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0;
}

function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}
