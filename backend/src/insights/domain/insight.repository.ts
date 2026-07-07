import { EmployeeStatus } from '@prisma/client';
import { CurrencyAggregate } from './pay-insight';
import { DimensionAggregate } from './breakdown';

/**
 * The shared workforce filter set. Every field is optional and whitelisted to
 * exactly what the employee list accepts, so the dashboard and the list always
 * describe the same filtered population (a trust requirement, FR-5.3).
 */
export interface InsightsFilter {
  search?: string;
  department?: string;
  country?: string;
  status?: EmployeeStatus;
}

/**
 * Read-only aggregation port. Each method returns rows already grouped by
 * `currencyCode` (and, for breakdowns, by dimension) in the database. The
 * application layer computes averages and assembles the views; it never sums
 * across currencies because every row already carries its own `currency`.
 */
export abstract class InsightRepository {
  abstract overview(filter: InsightsFilter): Promise<CurrencyAggregate[]>;
  abstract byDepartment(filter: InsightsFilter): Promise<DimensionAggregate[]>;
  abstract byCountry(filter: InsightsFilter): Promise<DimensionAggregate[]>;
}
