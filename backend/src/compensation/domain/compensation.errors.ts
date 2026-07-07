import { ValidationError } from 'src/platform';

/**
 * Domain failures for the compensation context. All are members of the
 * ValidationError (400) family — they are only ever reachable via bad input.
 * The platform `CurrencyMismatchError` is reused as-is (re-exported here) rather
 * than redefined, so a mixed-currency total is impossible by construction.
 */
export { CurrencyMismatchError } from 'src/platform';

/** A salary component amount was negative; annual amounts must be >= 0. */
export class NegativeAmountError extends ValidationError {
  constructor(componentType: string, amountMinor: number) {
    super(`Component ${componentType} amount must not be negative, got ${amountMinor}.`, [
      { field: 'amountMinor', reason: 'negative' },
    ]);
  }
}

/** An edit was attempted without a remark; the appraisal trail requires one. */
export class MissingRemarkError extends ValidationError {
  constructor() {
    super('A remark is required to edit salary.', [{ field: 'remark', reason: 'required' }]);
  }
}
