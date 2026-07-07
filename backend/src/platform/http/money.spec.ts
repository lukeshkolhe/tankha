import { Money } from './money';
import { CurrencyMismatchError } from '../errors/domain-error';

describe('Money', () => {
  describe('when creating a value', () => {
    it('holds an integer minor amount and a currency code', () => {
      const money = Money.of(250000, 'INR');

      expect(money.amountMinor).toBe(250000);
      expect(money.currencyCode).toBe('INR');
    });

    it('rejects a non-integer minor amount, since minor units are indivisible', () => {
      expect(() => Money.of(2500.5, 'INR')).toThrow();
    });

    it('rejects a negative amount', () => {
      expect(() => Money.of(-1, 'INR')).toThrow();
    });

    it('provides a zero constant per currency', () => {
      expect(Money.zero('USD').amountMinor).toBe(0);
      expect(Money.zero('USD').currencyCode).toBe('USD');
    });
  });

  describe('when adding two amounts', () => {
    it('sums the minor amounts of the same currency', () => {
      const total = Money.of(8000000, 'INR').add(Money.of(4000000, 'INR'));

      expect(total.amountMinor).toBe(12000000);
      expect(total.currencyCode).toBe('INR');
    });

    it('refuses to add across currencies (NFR-3: no FX, no blended totals)', () => {
      const inr = Money.of(100, 'INR');
      const usd = Money.of(100, 'USD');

      expect(() => inr.add(usd)).toThrow(CurrencyMismatchError);
    });
  });

  describe('when summing a list of components', () => {
    it('folds them into a single-currency total', () => {
      const total = Money.sum(
        [Money.of(8000000, 'INR'), Money.of(4000000, 'INR'), Money.of(500000, 'INR')],
        'INR',
      );

      expect(total.amountMinor).toBe(12500000);
    });

    it('returns zero for an empty list', () => {
      expect(Money.sum([], 'INR').amountMinor).toBe(0);
    });

    it('rejects a list mixing currencies', () => {
      expect(() => Money.sum([Money.of(1, 'INR'), Money.of(1, 'USD')], 'INR')).toThrow(
        CurrencyMismatchError,
      );
    });
  });

  describe('equality', () => {
    it('two amounts of the same value and currency are equal', () => {
      expect(Money.of(100, 'INR').equals(Money.of(100, 'INR'))).toBe(true);
    });

    it('differing currency is not equal', () => {
      expect(Money.of(100, 'INR').equals(Money.of(100, 'USD'))).toBe(false);
    });
  });
});
