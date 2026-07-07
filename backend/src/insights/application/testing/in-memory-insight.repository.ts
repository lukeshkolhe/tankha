import { InsightRepository, InsightsFilter } from '../../domain/insight.repository';
import { CurrencyAggregate } from '../../domain/pay-insight';
import { DimensionAggregate } from '../../domain/breakdown';

/**
 * In-memory InsightRepository for use-case unit tests. Returns pre-seeded
 * grouped rows — exactly what the real DB `groupBy` would emit — so tests
 * exercise the averaging/assembly logic without Postgres.
 */
export class InMemoryInsightRepository extends InsightRepository {
  constructor(
    private readonly overviewRows: CurrencyAggregate[] = [],
    private readonly departmentRows: DimensionAggregate[] = [],
    private readonly countryRows: DimensionAggregate[] = [],
  ) {
    super();
  }

  async overview(_filter: InsightsFilter): Promise<CurrencyAggregate[]> {
    return this.overviewRows;
  }

  async byDepartment(_filter: InsightsFilter): Promise<DimensionAggregate[]> {
    return this.departmentRows;
  }

  async byCountry(_filter: InsightsFilter): Promise<DimensionAggregate[]> {
    return this.countryRows;
  }
}
