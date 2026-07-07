import { SalaryComponent } from './salary-component.vo';
import { NegativeAmountError } from './compensation.errors';

describe('SalaryComponent', () => {
  it('holds a component type and an annual minor amount', () => {
    const component = SalaryComponent.of('BASIC', 8000000, 'INR');

    expect(component.type).toBe('BASIC');
    expect(component.amountMinor).toBe(8000000);
    expect(component.amount.currencyCode).toBe('INR');
  });

  it('accepts zero (e.g. an unused allowance)', () => {
    expect(SalaryComponent.of('TRANSPORT_ALLOWANCE', 0, 'INR').amountMinor).toBe(0);
  });

  it('rejects a negative amount at construction, so an invalid component cannot exist', () => {
    expect(() => SalaryComponent.of('BASIC', -1, 'INR')).toThrow(NegativeAmountError);
  });
});
