import { SalaryComponentType } from '@prisma/client';
import { Money } from 'src/platform';
import { NegativeAmountError } from './compensation.errors';

/**
 * A single line of pay: a fixed component type paired with an annual `Money`
 * amount. Immutable and self-validating — a negative amount is rejected at
 * construction, so an invalid component can never exist.
 */
export class SalaryComponent {
  private constructor(
    readonly type: SalaryComponentType,
    readonly amount: Money,
  ) {}

  static of(type: SalaryComponentType, amountMinor: number, currencyCode: string): SalaryComponent {
    if (amountMinor < 0) {
      throw new NegativeAmountError(type, amountMinor);
    }
    return new SalaryComponent(type, Money.of(amountMinor, currencyCode));
  }

  get amountMinor(): number {
    return this.amount.amountMinor;
  }
}
