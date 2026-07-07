import { CurrencyAggregate, CurrencyGroup, toCurrencyGroups } from './pay-insight';

/** A repository row: one (dimension × currency) aggregate. */
export interface DimensionAggregate extends CurrencyAggregate {
  dimension: string;
}

/** One breakdown line: a dimension with its per-currency groups, never blended. */
export interface BreakdownRow {
  dimension: string;
  currencyGroups: CurrencyGroup[];
}

/** Fold (dimension × currency) rows into one BreakdownRow per dimension. */
export function toBreakdownRows(rows: readonly DimensionAggregate[]): BreakdownRow[] {
  const byDimension = groupByDimension(rows);
  return [...byDimension].map(([dimension, aggregates]) => ({
    dimension,
    currencyGroups: toCurrencyGroups(aggregates),
  }));
}

function groupByDimension(rows: readonly DimensionAggregate[]): Map<string, CurrencyAggregate[]> {
  const byDimension = new Map<string, CurrencyAggregate[]>();
  for (const row of rows) {
    const bucket = byDimension.get(row.dimension) ?? [];
    bucket.push({ currency: row.currency, headcount: row.headcount, totalMinor: row.totalMinor });
    byDimension.set(row.dimension, bucket);
  }
  return byDimension;
}
