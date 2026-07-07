import { describe, expect, it } from 'vitest';
import {
  SALARY_COMPONENT_LABELS,
  SALARY_COMPONENT_TYPES,
  computeTotalMinor,
  normalizeOldTotalMinor,
  toMinorUnits,
} from './salary-math';

describe('toMinorUnits', () => {
  it('converts a major-unit decimal string into integer minor units for a 2-digit currency', () => {
    expect(toMinorUnits('800000', 2)).toBe(80000000);
    expect(toMinorUnits('800000.5', 2)).toBe(80000050);
  });

  it('converts cleanly for a zero-digit currency (e.g. JPY) with no fractional minor units', () => {
    expect(toMinorUnits('6000000', 0)).toBe(6000000);
  });

  it('treats blank or non-numeric input as zero, so a half-typed field never blows up the live total', () => {
    expect(toMinorUnits('', 2)).toBe(0);
    expect(toMinorUnits('abc', 2)).toBe(0);
  });

  it('rounds to the nearest minor unit to avoid floating-point drift', () => {
    expect(toMinorUnits('0.1', 2)).toBe(10);
  });
});

describe('computeTotalMinor', () => {
  it('sums a list of minor-unit amounts into the live total', () => {
    expect(computeTotalMinor([8000000, 4000000, 1500000, 500000, 200000])).toBe(14200000);
  });

  it('sums to zero for an empty list', () => {
    expect(computeTotalMinor([])).toBe(0);
  });
});

describe('normalizeOldTotalMinor', () => {
  it('passes a real number through unchanged', () => {
    expect(normalizeOldTotalMinor(12000000)).toBe(12000000);
  });

  it('returns null for the initial revision, which has no prior total', () => {
    expect(normalizeOldTotalMinor(null)).toBeNull();
  });
});

describe('SALARY_COMPONENT_TYPES', () => {
  it('lists exactly the five fixed component types in the canonical display order', () => {
    expect(SALARY_COMPONENT_TYPES).toEqual([
      'BASIC',
      'HOUSE_RENT_ALLOWANCE',
      'SPECIAL_ALLOWANCE',
      'TRANSPORT_ALLOWANCE',
      'ANNUAL_BONUS',
    ]);
  });

  it('has a human-readable label for every fixed component type', () => {
    for (const type of SALARY_COMPONENT_TYPES) {
      expect(SALARY_COMPONENT_LABELS[type]).toBeTruthy();
    }
    expect(SALARY_COMPONENT_LABELS.HOUSE_RENT_ALLOWANCE).toBe('House Rent Allowance');
  });
});
