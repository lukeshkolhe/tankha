import { describe, expect, it } from 'vitest';
import {
  createEmployeeFormSchema,
  defaultSalaryComponents,
  employeeAttributesSchema,
} from './employee-form-schema';

function validAttributes() {
  return {
    employeeCode: 'EMP-1001',
    firstName: 'Ravi',
    lastName: 'Kumar',
    departmentId: 'dep_1',
    designationId: 'des_1',
    countryCode: 'IN',
    currencyCode: 'INR',
    joinDate: '2021-04-01',
  };
}

describe('employeeAttributesSchema', () => {
  it('accepts a fully populated set of attributes', () => {
    const result = employeeAttributesSchema.safeParse(validAttributes());
    expect(result.success).toBe(true);
  });

  it.each(['employeeCode', 'firstName', 'lastName', 'departmentId', 'designationId', 'countryCode', 'currencyCode', 'joinDate'])(
    'rejects a blank %s',
    (field) => {
      const result = employeeAttributesSchema.safeParse({ ...validAttributes(), [field]: '' });
      expect(result.success).toBe(false);
    },
  );
});

describe('createEmployeeFormSchema', () => {
  function validCreatePayload() {
    return {
      ...validAttributes(),
      salaryComponents: defaultSalaryComponents(),
    };
  }

  it('accepts valid attributes with the default (zero-amount) salary rows', () => {
    const result = createEmployeeFormSchema.safeParse(validCreatePayload());
    expect(result.success).toBe(true);
  });

  it('rejects a negative salary component amount', () => {
    const payload = validCreatePayload();
    payload.salaryComponents[0] = { ...payload.salaryComponents[0], amountMajor: '-100' };

    const result = createEmployeeFormSchema.safeParse(payload);

    expect(result.success).toBe(false);
  });

  it('rejects a non-numeric salary component amount', () => {
    const payload = validCreatePayload();
    payload.salaryComponents[0] = { ...payload.salaryComponents[0], amountMajor: 'abc' };

    const result = createEmployeeFormSchema.safeParse(payload);

    expect(result.success).toBe(false);
  });

  it('rejects a missing required attribute even when salary rows are valid', () => {
    const payload = { ...validCreatePayload(), employeeCode: '' };

    const result = createEmployeeFormSchema.safeParse(payload);

    expect(result.success).toBe(false);
  });
});

describe('defaultSalaryComponents', () => {
  it('returns the 5 fixed component rows in a stable order, each zeroed out', () => {
    expect(defaultSalaryComponents()).toEqual([
      { type: 'BASIC', amountMajor: '0' },
      { type: 'HOUSE_RENT_ALLOWANCE', amountMajor: '0' },
      { type: 'SPECIAL_ALLOWANCE', amountMajor: '0' },
      { type: 'TRANSPORT_ALLOWANCE', amountMajor: '0' },
      { type: 'ANNUAL_BONUS', amountMajor: '0' },
    ]);
  });
});
