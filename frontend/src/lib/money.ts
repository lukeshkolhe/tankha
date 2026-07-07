/**
 * Every currency reads as `SYMBOL + comma-grouped major units` via the
 * platform's own `Intl.NumberFormat` — no hand-maintained symbol table.
 * `en-US` is the base locale for consistent left-to-right symbol placement;
 * INR is the one deliberate override, since Indian digit grouping (lakhs) is
 * how HR actually reads Indian payroll figures.
 */
const LOCALE_BY_CURRENCY: Record<string, string> = {
  INR: 'en-IN',
};
const DEFAULT_LOCALE = 'en-US';

/** Converts an integer minor-unit amount (as the API always sends it) to major units. */
export function toMajorUnits(amountMinor: number, minorUnitDigits: number): number {
  return amountMinor / 10 ** minorUnitDigits;
}

/** Formats an integer minor-unit amount as a locale- and currency-correct string. */
export function formatMoney(
  amountMinor: number,
  currencyCode: string,
  minorUnitDigits: number,
): string {
  const locale = LOCALE_BY_CURRENCY[currencyCode] ?? DEFAULT_LOCALE;
  const majorAmount = toMajorUnits(amountMinor, minorUnitDigits);
  return new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode }).format(
    majorAmount,
  );
}
