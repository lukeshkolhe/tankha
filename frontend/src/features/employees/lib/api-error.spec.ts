import { describe, expect, it } from 'vitest';
import { extractFieldErrors } from './api-error';

describe('extractFieldErrors', () => {
  it('maps a duplicate employeeCode detail to a human field error', () => {
    const errors = extractFieldErrors({
      details: [{ field: 'employeeCode', reason: 'duplicate' }],
    });

    expect(errors).toEqual({ employeeCode: 'This employee code is already in use.' });
  });

  it('falls back to the raw reason text for an unrecognised reason', () => {
    const errors = extractFieldErrors({
      details: [{ field: 'countryCode', reason: 'unknown-reference' }],
    });

    expect(errors).toEqual({ countryCode: 'unknown-reference' });
  });

  it('maps multiple details onto multiple fields', () => {
    const errors = extractFieldErrors({
      details: [
        { field: 'employeeCode', reason: 'duplicate' },
        { field: 'departmentId', reason: 'unknown-reference' },
      ],
    });

    expect(errors).toEqual({
      employeeCode: 'This employee code is already in use.',
      departmentId: 'unknown-reference',
    });
  });

  it('returns an empty object for an error with no details', () => {
    expect(extractFieldErrors({ message: 'Something went wrong' })).toEqual({});
  });

  it('returns an empty object for a non-object error', () => {
    expect(extractFieldErrors(null)).toEqual({});
    expect(extractFieldErrors(undefined)).toEqual({});
    expect(extractFieldErrors('boom')).toEqual({});
  });
});
