import {
  EmployeeValidation,
  EmployeeValidationInput,
  ValidationReason,
} from './employee-validation';
import { ValidReferences } from './reference.repository';

const references: ValidReferences = {
  departmentIds: new Set(['dep_1']),
  designationIds: new Set(['des_1']),
  countryCodes: new Set(['IN']),
  currencyCodes: new Set(['INR']),
};

function validInput(overrides: Partial<EmployeeValidationInput> = {}): EmployeeValidationInput {
  return {
    employeeCode: 'EMP-1001',
    firstName: 'Ravi',
    lastName: 'Kumar',
    departmentId: 'dep_1',
    designationId: 'des_1',
    countryCode: 'IN',
    currencyCode: 'INR',
    joinDate: '2021-04-01',
    salaryComponents: [{ type: 'BASIC', amountMinor: 8000000 }],
    ...overrides,
  };
}

describe('EmployeeValidation', () => {
  it('returns no errors for a fully valid row', () => {
    expect(EmployeeValidation.validate(validInput(), references, false)).toEqual([]);
  });

  it('flags each missing required field', () => {
    const input = validInput({ employeeCode: '', firstName: '  ', lastName: '', joinDate: '' });

    const errors = EmployeeValidation.validate(input, references, false);

    const required = errors.filter((error) => error.reason === ValidationReason.Required);
    expect(required.map((error) => error.field).sort()).toEqual([
      'employeeCode',
      'firstName',
      'joinDate',
      'lastName',
    ]);
  });

  it('flags an unknown departmentId as an unknown reference', () => {
    const errors = EmployeeValidation.validate(validInput({ departmentId: 'nope' }), references, false);

    expect(errors).toContainEqual({ field: 'departmentId', reason: ValidationReason.UnknownReference });
  });

  it('flags an unknown currencyCode as an unknown reference', () => {
    const errors = EmployeeValidation.validate(validInput({ currencyCode: 'ZZZ' }), references, false);

    expect(errors).toContainEqual({ field: 'currencyCode', reason: ValidationReason.UnknownReference });
  });

  it('flags a negative salary amount', () => {
    const input = validInput({ salaryComponents: [{ type: 'BASIC', amountMinor: -1 }] });

    const errors = EmployeeValidation.validate(input, references, false);

    expect(errors).toContainEqual({ field: 'salary.components', reason: ValidationReason.Negative });
  });

  it('flags an empty salary components list when salary is provided', () => {
    const errors = EmployeeValidation.validate(validInput({ salaryComponents: [] }), references, false);

    expect(errors).toContainEqual({ field: 'salary.components', reason: ValidationReason.Required });
  });

  it('skips salary rules entirely when salary is omitted (edit path)', () => {
    const input = validInput({ salaryComponents: undefined });

    expect(EmployeeValidation.validate(input, references, false)).toEqual([]);
  });

  it('signals a duplicate code when the code already exists', () => {
    const errors = EmployeeValidation.validate(validInput(), references, true);

    expect(errors).toContainEqual({ field: 'employeeCode', reason: ValidationReason.Duplicate });
  });
});
