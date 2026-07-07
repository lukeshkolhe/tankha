import { describe, expect, it } from 'vitest';
import { buildSalaryComponentsPayload, toMinorUnits } from './salary-conversion';

describe('toMinorUnits', () => {
  it('converts a 2-decimal-digit currency major amount to integer minor units', () => {
    expect(toMinorUnits(80000, 2)).toBe(8000000);
  });

  it('converts a 0-decimal-digit currency major amount to integer minor units', () => {
    expect(toMinorUnits(4500, 0)).toBe(4500);
  });

  it('rounds fractional results instead of truncating', () => {
    // 10.005 * 100 = 1000.4999999999999 in floating point — must round, not floor.
    expect(toMinorUnits(10.005, 2)).toBe(1001);
  });

  it('treats a non-2-decimal-digit currency correctly (e.g. 3-digit minor units)', () => {
    expect(toMinorUnits(12.345, 3)).toBe(12345);
  });
});

describe('buildSalaryComponentsPayload', () => {
  it('maps each form row to a SalaryComponentDto with converted minor units', () => {
    const payload = buildSalaryComponentsPayload(
      [
        { type: 'BASIC', amountMajor: '80000' },
        { type: 'HOUSE_RENT_ALLOWANCE', amountMajor: '40000' },
      ],
      2,
    );

    expect(payload).toEqual([
      { type: 'BASIC', amountMinor: 8000000 },
      { type: 'HOUSE_RENT_ALLOWANCE', amountMinor: 4000000 },
    ]);
  });

  it('treats a blank amount as zero', () => {
    const payload = buildSalaryComponentsPayload([{ type: 'ANNUAL_BONUS', amountMajor: '' }], 2);

    expect(payload).toEqual([{ type: 'ANNUAL_BONUS', amountMinor: 0 }]);
  });
});
