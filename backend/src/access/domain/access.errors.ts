import { DuplicateError, UnauthorizedError, ValidationError } from 'src/platform';

/**
 * Domain failures for the access context. Each maps to a platform error family
 * so the global DomainExceptionFilter turns it into the right HTTP response
 * without the domain knowing about HTTP.
 */

/** A signup used an email that already has an account (globally unique login). */
export class EmailAlreadyRegisteredError extends DuplicateError {
  constructor(email: string) {
    super(`The email ${email} is already registered.`, [{ field: 'email', reason: 'duplicate' }]);
  }
}

/** A string was not a well-formed email address. */
export class InvalidEmailError extends ValidationError {
  constructor(value: string) {
    super(`"${value}" is not a valid email address.`, [{ field: 'email', reason: 'invalid' }]);
  }
}

/**
 * A login failed. Deliberately generic: the same error is thrown for an unknown
 * email and for a wrong password, so an attacker cannot probe which emails exist.
 */
export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super('Email or password is incorrect.');
  }
}
