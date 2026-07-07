import { describe, expect, it } from 'vitest';
import { toMinorUnitDigitsMap } from './currency-minor-units';

describe('toMinorUnitDigitsMap', () => {
  it('builds a currency-code -> minor-unit-digits lookup from the reference list', () => {
    const map = toMinorUnitDigitsMap([
      { code: 'INR', name: 'Indian Rupee', symbol: '₹', minorUnitDigits: 2 },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥', minorUnitDigits: 0 },
    ]);

    expect(map).toEqual({ INR: 2, JPY: 0 });
  });

  it('returns an empty map for an empty reference list', () => {
    expect(toMinorUnitDigitsMap([])).toEqual({});
  });
});
