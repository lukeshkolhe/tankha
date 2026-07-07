import { CurrencyMismatchError, ValidationError } from '../errors/domain-error';

/**
 * Money as an immutable value object: an integer minor amount paired with an
 * explicit currency code. Never a float, never blended across currencies —
 * `add` refuses a currency mismatch, which is what forces the insights layer to
 * group by currency (NFR-3). Display formatting uses Currency.minorUnitDigits.
 */
export class Money {
  private constructor(
    readonly amountMinor: number,
    readonly currencyCode: string,
  ) {}

  static of(amountMinor: number, currencyCode: string): Money {
    if (!Number.isInteger(amountMinor)) {
      throw new ValidationError(`Amount must be an integer minor value, got ${amountMinor}.`);
    }
    if (amountMinor < 0) {
      throw new ValidationError(`Amount must not be negative, got ${amountMinor}.`);
    }
    return new Money(amountMinor, currencyCode);
  }

  static zero(currencyCode: string): Money {
    return new Money(0, currencyCode);
  }

  static sum(amounts: Money[], currencyCode: string): Money {
    return amounts.reduce((total, amount) => total.add(amount), Money.zero(currencyCode));
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amountMinor + other.amountMinor, this.currencyCode);
  }

  equals(other: Money): boolean {
    return this.amountMinor === other.amountMinor && this.currencyCode === other.currencyCode;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currencyCode !== other.currencyCode) {
      throw new CurrencyMismatchError(this.currencyCode, other.currencyCode);
    }
  }
}
