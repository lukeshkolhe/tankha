import { SalaryStructure } from './salary-structure.entity';
import { SalaryComponent } from './salary-component.vo';

function inrStructure(): SalaryStructure {
  return SalaryStructure.create('emp_1', 'org_1', 'INR', [
    SalaryComponent.of('BASIC', 8000000, 'INR'),
    SalaryComponent.of('HOUSE_RENT_ALLOWANCE', 4000000, 'INR'),
  ]);
}

describe('SalaryStructure', () => {
  it('derives its total from the components (invariant: total = Σ components)', () => {
    expect(inrStructure().totalMinor).toBe(12000000);
  });

  it('exposes the total as Money carrying the structure currency', () => {
    const total = inrStructure().total;

    expect(total.currencyCode).toBe('INR');
    expect(total.amountMinor).toBe(12000000);
  });

  it('produces a new structure when components are replaced, keeping identity and currency', () => {
    const edited = inrStructure().withComponents([SalaryComponent.of('BASIC', 9000000, 'INR')]);

    expect(edited.employeeId).toBe('emp_1');
    expect(edited.currencyCode).toBe('INR');
    expect(edited.totalMinor).toBe(9000000);
  });
});
