import { InvalidEmailError } from './access.errors';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * An email address as a self-validating value object. Construction rejects a
 * malformed address, so an invalid Email can never exist; the stored value is
 * normalised to lower-case so lookups and the unique constraint are consistent.
 */
export class Email {
  private constructor(readonly value: string) {}

  static of(raw: string): Email {
    const normalised = raw.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalised)) {
      throw new InvalidEmailError(raw);
    }
    return new Email(normalised);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
