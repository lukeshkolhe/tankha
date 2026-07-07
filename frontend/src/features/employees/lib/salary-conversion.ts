import type { components } from '../../../api/schema';

export type SalaryComponentDto = components['schemas']['SalaryComponentDto'];
export type SalaryComponentType = SalaryComponentDto['type'];

/** One row of the fixed 5-row salary sub-form: a component type + its major-unit amount. */
export interface SalaryComponentFormValue {
  type: SalaryComponentType;
  /** Kept as a string so it binds directly to a text input; converted at submit time. */
  amountMajor: string;
}

/**
 * Converts a decimal major-unit amount (what HR types, e.g. "800.00") into the
 * integer minor-unit amount the API stores (e.g. paise, cents), per the
 * currency's own `minorUnitDigits` — never a hardcoded "divide by 100".
 * `Math.round` guards against float drift (e.g. 10.005 * 100 !== 1000.5 exactly).
 */
export function toMinorUnits(majorAmount: number, minorUnitDigits: number): number {
  return Math.round(majorAmount * 10 ** minorUnitDigits);
}

/** Maps the 5-row salary sub-form into the `SalaryComponentDto[]` the API expects. */
export function buildSalaryComponentsPayload(
  components: SalaryComponentFormValue[],
  minorUnitDigits: number,
): SalaryComponentDto[] {
  return components.map((component) => ({
    type: component.type,
    amountMinor: toMinorUnits(component.amountMajor === '' ? 0 : Number(component.amountMajor), minorUnitDigits),
  }));
}
