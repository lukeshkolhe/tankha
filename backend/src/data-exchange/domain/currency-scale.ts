/**
 * The major↔minor conversion the sheet needs: component columns are written in
 * MAJOR units (what a human types), while `compensation` stores integer MINOR
 * units. The scale is `10 ** minorUnitDigits` — 2 for INR/USD, 0 for JPY — read
 * from `Currency.minorUnitDigits`.
 *
 * `12.50` at 2 digits → 1250 minor; `1000` at 0 digits → 1000 minor. A blank
 * cell reads as zero; a non-numeric cell yields `NaN`, which fails the shared
 * salary rules as an invalid amount.
 */
export function toMinorUnits(major: string, minorUnitDigits: number): number {
  const trimmed = major.trim();
  const value = trimmed === '' ? 0 : Number(trimmed);
  return Math.round(value * 10 ** minorUnitDigits);
}

/** Inverse of {@link toMinorUnits}: 1250 minor at 2 digits → 12.5 major. */
export function toMajorUnits(minor: number, minorUnitDigits: number): number {
  return minor / 10 ** minorUnitDigits;
}
