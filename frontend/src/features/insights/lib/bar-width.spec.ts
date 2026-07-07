import { describe, expect, it } from 'vitest';
import { headcountToBarWidthPercent } from './bar-width';

describe('headcountToBarWidthPercent', () => {
  it('returns 100 for the row holding the maximum headcount', () => {
    expect(headcountToBarWidthPercent(3200, 3200)).toBe(100);
  });

  it('returns a proportional percentage relative to the maximum headcount', () => {
    expect(headcountToBarWidthPercent(900, 3200)).toBeCloseTo(28.125, 5);
  });

  it('floors very small non-zero headcounts to a minimum visible width', () => {
    expect(headcountToBarWidthPercent(1, 10000)).toBe(4);
  });

  it('returns 0 for a zero headcount', () => {
    expect(headcountToBarWidthPercent(0, 3200)).toBe(0);
  });

  it('returns 0 when the maximum headcount is 0 (empty dataset)', () => {
    expect(headcountToBarWidthPercent(0, 0)).toBe(0);
  });

  it('never exceeds 100 even if headcount somehow exceeds the given maximum', () => {
    expect(headcountToBarWidthPercent(5000, 3200)).toBe(100);
  });
});
