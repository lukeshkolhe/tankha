import { Money, ValidationError } from 'src/platform';
import { SalaryComponent } from './salary-component.vo';

/**
 * The one correct-by-construction total rule: sum the components' `Money`
 * values. Because `Money.add` refuses to combine currencies, a structure whose
 * components disagree on currency cannot produce a total — it throws
 * `CurrencyMismatchError` instead of silently blending.
 */
export function computeTotal(components: readonly SalaryComponent[]): Money {
  if (components.length === 0) {
    throw new ValidationError('A salary structure needs at least one component.');
  }
  return components.map((component) => component.amount).reduce((running, amount) => running.add(amount));
}
