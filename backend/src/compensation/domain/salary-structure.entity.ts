import { Money } from 'src/platform';
import { SalaryComponent } from './salary-component.vo';
import { computeTotal } from './salary-total';

/**
 * An employee's current pay: its components and the total they sum to. The
 * total is never stored on the entity — it is always derived via `computeTotal`,
 * so the invariant `total = Σ components` holds by construction. `currencyCode`
 * follows the employee and is fixed for the life of the structure.
 */
export class SalaryStructure {
  private constructor(
    readonly employeeId: string,
    readonly organisationId: string,
    readonly currencyCode: string,
    readonly components: readonly SalaryComponent[],
  ) {}

  static create(
    employeeId: string,
    organisationId: string,
    currencyCode: string,
    components: readonly SalaryComponent[],
  ): SalaryStructure {
    return new SalaryStructure(employeeId, organisationId, currencyCode, components);
  }

  withComponents(components: readonly SalaryComponent[]): SalaryStructure {
    return SalaryStructure.create(this.employeeId, this.organisationId, this.currencyCode, components);
  }

  get total(): Money {
    return computeTotal(this.components);
  }

  get totalMinor(): number {
    return this.total.amountMinor;
  }
}
