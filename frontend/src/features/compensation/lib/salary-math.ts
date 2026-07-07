/**
 * Small, pure, independently-testable helpers behind the edit-salary form and
 * the revision timeline. Kept free of React/Mantine/react-hook-form so the
 * money math can be verified without rendering anything.
 */

/** The fixed MVP component set, in the order every screen displays them. */
export const SALARY_COMPONENT_TYPES = [
  'BASIC',
  'HOUSE_RENT_ALLOWANCE',
  'SPECIAL_ALLOWANCE',
  'TRANSPORT_ALLOWANCE',
  'ANNUAL_BONUS',
] as const;

export type SalaryComponentType = (typeof SALARY_COMPONENT_TYPES)[number];

export const SALARY_COMPONENT_LABELS: Record<SalaryComponentType, string> = {
  BASIC: 'Basic',
  HOUSE_RENT_ALLOWANCE: 'House Rent Allowance',
  SPECIAL_ALLOWANCE: 'Special Allowance',
  TRANSPORT_ALLOWANCE: 'Transport Allowance',
  ANNUAL_BONUS: 'Annual Bonus',
};

/**
 * Converts a major-unit decimal string (whatever the user typed into an
 * amount field) into an integer minor-unit amount, the only shape the API
 * accepts. Blank/non-numeric input is treated as zero rather than throwing,
 * so a half-typed field never breaks the live total. Rounded to the nearest
 * minor unit to avoid floating-point drift (e.g. 0.1 * 100 in JS float math).
 */
export function toMinorUnits(majorAmount: string, minorUnitDigits: number): number {
  const parsed = Number(majorAmount);
  if (majorAmount.trim() === '' || !Number.isFinite(parsed)) {
    return 0;
  }
  return Math.round(parsed * 10 ** minorUnitDigits);
}

/** Sums minor-unit amounts — the client mirror of the server's authoritative total. */
export function computeTotalMinor(amountsMinor: number[]): number {
  return amountsMinor.reduce((sum, amount) => sum + amount, 0);
}

/**
 * `RevisionViewDto.oldTotalMinor` is typed as `Record<string, never> | null`
 * in the generated `schema.d.ts` (an openapi-typescript artifact of how the
 * backend documents a nullable number) even though the real payload is a
 * number or null. This is the one place that mismatch is bridged, so every
 * consumer works with a plain `number | null`.
 */
export function normalizeOldTotalMinor(oldTotalMinor: unknown): number | null {
  return oldTotalMinor === null ? null : (oldTotalMinor as number);
}
