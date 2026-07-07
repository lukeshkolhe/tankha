import { computeTotal } from './salary-total';
import { SalaryComponent } from './salary-component.vo';
import { CurrencyMismatchError } from 'src/platform';

describe('computeTotal', () => {
  it('sums the annual component amounts into a single-currency Money', () => {
    const total = computeTotal([
      SalaryComponent.of('BASIC', 8000000, 'INR'),
      SalaryComponent.of('HOUSE_RENT_ALLOWANCE', 4000000, 'INR'),
      SalaryComponent.of('ANNUAL_BONUS', 500000, 'INR'),
    ]);

    expect(total.amountMinor).toBe(12500000);
    expect(total.currencyCode).toBe('INR');
  });

  it('refuses to blend components of different currencies (NFR-3)', () => {
    expect(() =>
      computeTotal([
        SalaryComponent.of('BASIC', 8000000, 'INR'),
        SalaryComponent.of('SPECIAL_ALLOWANCE', 100, 'USD'),
      ]),
    ).toThrow(CurrencyMismatchError);
  });

  it('rejects an empty structure — a salary must have at least one component', () => {
    expect(() => computeTotal([])).toThrow();
  });
});
