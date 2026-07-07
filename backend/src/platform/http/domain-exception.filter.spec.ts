import { ArgumentsHost } from '@nestjs/common';
import { DomainExceptionFilter } from './domain-exception.filter';
import { DuplicateError, ValidationError } from '../errors/domain-error';

function hostReturning(): { host: ArgumentsHost; captured: { status?: number; body?: unknown } } {
  const captured: { status?: number; body?: unknown } = {};
  const response = {
    status(code: number) {
      captured.status = code;
      return this;
    },
    json(body: unknown) {
      captured.body = body;
      return this;
    },
  };
  const host = {
    switchToHttp: () => ({ getResponse: () => response }),
  } as unknown as ArgumentsHost;
  return { host, captured };
}

describe('DomainExceptionFilter', () => {
  it('maps a DuplicateError to the standard 409 body', () => {
    const { host, captured } = hostReturning();

    new DomainExceptionFilter().catch(
      new DuplicateError('Employee code EMP-1001 already exists in this organisation.', [
        { field: 'employeeCode', reason: 'duplicate' },
      ]),
      host,
    );

    expect(captured.status).toBe(409);
    expect(captured.body).toEqual({
      statusCode: 409,
      error: 'CONFLICT',
      message: 'Employee code EMP-1001 already exists in this organisation.',
      details: [{ field: 'employeeCode', reason: 'duplicate' }],
    });
  });

  it('omits details when the error carries none', () => {
    const { host, captured } = hostReturning();

    new DomainExceptionFilter().catch(new ValidationError('Bad input'), host);

    expect(captured.status).toBe(400);
    expect(captured.body).toEqual({
      statusCode: 400,
      error: 'VALIDATION_ERROR',
      message: 'Bad input',
    });
  });
});
