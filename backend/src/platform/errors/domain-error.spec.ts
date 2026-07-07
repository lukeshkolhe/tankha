import {
  DomainError,
  ValidationError,
  UnauthorizedError,
  TenantForbiddenError,
  NotFoundError,
  DuplicateError,
  CurrencyMismatchError,
} from './domain-error';

describe('DomainError hierarchy', () => {
  it('every typed error maps to its documented HTTP status and code', () => {
    const cases: Array<[DomainError, number, string]> = [
      [new ValidationError('bad'), 400, 'VALIDATION_ERROR'],
      [new UnauthorizedError('nope'), 401, 'UNAUTHORIZED'],
      [new TenantForbiddenError('cross-tenant'), 403, 'FORBIDDEN'],
      [new NotFoundError('gone'), 404, 'NOT_FOUND'],
      [new DuplicateError('dup'), 409, 'CONFLICT'],
    ];

    for (const [error, httpStatus, code] of cases) {
      expect(error).toBeInstanceOf(DomainError);
      expect(error.httpStatus).toBe(httpStatus);
      expect(error.code).toBe(code);
    }
  });

  it('carries optional field-level details for form feedback', () => {
    const error = new ValidationError('Employee code already exists', [
      { field: 'employeeCode', reason: 'duplicate' },
    ]);

    expect(error.details).toEqual([{ field: 'employeeCode', reason: 'duplicate' }]);
  });

  it('CurrencyMismatchError is a validation error (400)', () => {
    const error = new CurrencyMismatchError('INR', 'USD');

    expect(error).toBeInstanceOf(ValidationError);
    expect(error.httpStatus).toBe(400);
    expect(error.message).toContain('INR');
    expect(error.message).toContain('USD');
  });

  it('is a real Error with a usable stack and message', () => {
    const error = new NotFoundError('Employee emp_1 not found');

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Employee emp_1 not found');
    expect(error.stack).toBeDefined();
  });
});
