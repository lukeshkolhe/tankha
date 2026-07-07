import { describe, expect, it } from 'vitest';
import { formatMoney, toMajorUnits } from './money';

describe('toMajorUnits', () => {
  it('divides by 10^minorUnitDigits', () => {
    expect(toMajorUnits(2250000, 2)).toBe(22500);
    expect(toMajorUnits(1000, 0)).toBe(1000);
  });
});

describe('formatMoney', () => {
  it('formats INR with Indian digit grouping (lakhs), matching the ledger convention', () => {
    // 2,250,000 minor units at 2 digits -> ₹22,50,000.00 major, Indian grouping
    expect(formatMoney(225000000, 'INR', 2)).toBe('₹22,50,000.00');
  });

  it('formats USD with standard 3-digit grouping', () => {
    expect(formatMoney(12800000, 'USD', 2)).toBe('$128,000.00');
  });

  it('formats GBP and EUR with their own symbols, standard grouping', () => {
    expect(formatMoney(14250000, 'GBP', 2)).toBe('£142,500.00');
    expect(formatMoney(14250000, 'EUR', 2)).toBe('€142,500.00');
  });

  it('formats JPY with zero minor-unit digits (no decimals) and the standard half-width symbol', () => {
    expect(formatMoney(6000000, 'JPY', 0)).toBe('¥6,000,000');
  });

  it('formats zero as a valid amount, not blank', () => {
    expect(formatMoney(0, 'INR', 2)).toBe('₹0.00');
  });

  it('falls back to the ISO code as a prefix for a currency with no distinct symbol', () => {
    // Intl separates a code-as-symbol from the amount with a non-breaking space (U+00A0).
    expect(formatMoney(8800000, 'SGD', 2)).toBe(`SGD 88,000.00`);
  });
});
