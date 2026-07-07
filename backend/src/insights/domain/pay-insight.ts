/**
 * A per-currency aggregate as the repository returns it (grouped in the DB),
 * before the average is computed. `totalMinor` is only ever the sum WITHIN one
 * currency — there is no shape here that could carry a cross-currency total.
 */
export interface CurrencyAggregate {
  currency: string;
  headcount: number;
  totalMinor: number;
}

/** A per-currency compensation group with its integer average. */
export interface CurrencyGroup {
  currency: string;
  headcount: number;
  totalMinor: number;
  averageMinor: number;
}

/** Add `averageMinor` (integer division within each currency) to each group. */
export function toCurrencyGroups(aggregates: readonly CurrencyAggregate[]): CurrencyGroup[] {
  return aggregates.map(toCurrencyGroup);
}

function toCurrencyGroup(aggregate: CurrencyAggregate): CurrencyGroup {
  return { ...aggregate, averageMinor: averageOf(aggregate) };
}

function averageOf(aggregate: CurrencyAggregate): number {
  if (aggregate.headcount === 0) {
    return 0;
  }
  return Math.floor(aggregate.totalMinor / aggregate.headcount);
}
