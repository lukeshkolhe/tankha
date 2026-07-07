/**
 * Field-level detail attached to a validation failure so frontend forms can
 * highlight the offending input (see the standard error body in 00-platform.md).
 */
export interface FieldError {
  field: string;
  reason: string;
}

/**
 * Base class for every business-rule failure. Framework-free on purpose: the
 * domain and application layers throw these; the interface layer's
 * DomainExceptionFilter is the only thing that knows they become HTTP responses.
 */
export abstract class DomainError extends Error {
  abstract readonly httpStatus: number;
  abstract readonly code: string;

  constructor(
    message: string,
    readonly details?: FieldError[],
  ) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends DomainError {
  readonly httpStatus = 400;
  readonly code = 'VALIDATION_ERROR';
}

export class UnauthorizedError extends DomainError {
  readonly httpStatus = 401;
  readonly code = 'UNAUTHORIZED';
}

export class TenantForbiddenError extends DomainError {
  readonly httpStatus = 403;
  readonly code = 'FORBIDDEN';
}

export class NotFoundError extends DomainError {
  readonly httpStatus = 404;
  readonly code = 'NOT_FOUND';
}

export class DuplicateError extends DomainError {
  readonly httpStatus = 409;
  readonly code = 'CONFLICT';
}

/**
 * Raised by the Money value object when two different currencies would be added.
 * A ValidationError (400) because it is only ever reachable via bad input; the
 * type itself is what mechanically guarantees NFR-3 (no cross-currency totals).
 */
export class CurrencyMismatchError extends ValidationError {
  constructor(left: string, right: string) {
    super(`Cannot combine amounts in different currencies: ${left} and ${right}.`);
  }
}
