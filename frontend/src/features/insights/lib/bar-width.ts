/**
 * Converts a headcount into a bar-length percentage relative to the largest
 * headcount drawn in the same chart. Bar length must only ever encode
 * headcount — a currency-agnostic count — never money, since totals in
 * different currencies aren't comparable magnitudes and can't share one
 * axis. A small floor keeps a non-zero count visibly present as a bar.
 */
const MIN_VISIBLE_PERCENT = 4;
const MAX_PERCENT = 100;

export function headcountToBarWidthPercent(headcount: number, maxHeadcount: number): number {
  if (headcount <= 0 || maxHeadcount <= 0) {
    return 0;
  }

  const raw = (headcount / maxHeadcount) * MAX_PERCENT;
  return Math.min(Math.max(raw, MIN_VISIBLE_PERCENT), MAX_PERCENT);
}
