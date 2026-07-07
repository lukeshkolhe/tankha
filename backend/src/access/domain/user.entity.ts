import { Email } from './email.vo';

/**
 * An HR user who owns and operates an Organisation. Holds the argon2 password
 * hash — never the plaintext — and its email as a validated value object.
 */
export class User {
  private constructor(
    readonly id: string,
    readonly organisationId: string,
    readonly email: Email,
    readonly name: string,
    readonly passwordHash: string,
  ) {}

  static of(
    id: string,
    organisationId: string,
    email: Email,
    name: string,
    passwordHash: string,
  ): User {
    return new User(id, organisationId, email, name, passwordHash);
  }
}
