import { CurrencyGroup } from '../../domain/pay-insight';
import { BreakdownRow } from '../../domain/breakdown';
import { InsightsFilter } from '../../domain/insight.repository';

export { InsightsFilter, CurrencyGroup, BreakdownRow };

/**
 * `GET /insights/overview` response. `byCurrency` carries one group per currency;
 * no field ever sums `totalMinor` across those groups (NFR-3).
 */
export interface OverviewView {
  headcount: number;
  byCurrency: CurrencyGroup[];
}

/** `GET /insights/by-department | by-country` response — one row per dimension. */
export interface BreakdownView {
  breakdown: BreakdownRow[];
}
