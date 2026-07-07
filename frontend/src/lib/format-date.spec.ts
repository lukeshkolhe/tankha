import { describe, expect, it } from 'vitest';
import { formatDate } from './format-date';

describe('formatDate', () => {
  it('renders a date-only ISO string as "01 Apr 2021"', () => {
    expect(formatDate('2021-04-01')).toBe('01 Apr 2021');
  });

  it('renders a full ISO timestamp the same way, ignoring the time-of-day', () => {
    expect(formatDate('2026-04-01T09:12:00.000Z')).toBe('01 Apr 2026');
  });
});
