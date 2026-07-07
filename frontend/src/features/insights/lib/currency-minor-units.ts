import type { components } from '../../../api/schema';

type CurrencyItem = components['schemas']['CurrencyItemDto'];

/**
 * Builds a currency-code -> minor-unit-digits lookup from the reference
 * currency list. The insights endpoints carry a currency CODE on every
 * `CurrencyGroupDto` but never the digit count, so `formatMoney` needs this
 * looked up rather than assumed — JPY has 0 minor digits, most others have 2.
 */
export function toMinorUnitDigitsMap(currencies: CurrencyItem[]): Record<string, number> {
  return Object.fromEntries(currencies.map((currency) => [currency.code, currency.minorUnitDigits]));
}
