import { Injectable } from '@nestjs/common';
import { InsightRepository, InsightsFilter } from '../domain/insight.repository';
import { toBreakdownRows } from '../domain/breakdown';
import { BreakdownView } from './dto/insights-views';

/** Per-country, per-currency compensation breakdown (FR-5.2). */
@Injectable()
export class GetCountryBreakdownUseCase {
  constructor(private readonly repository: InsightRepository) {}

  async execute(filter: InsightsFilter): Promise<BreakdownView> {
    const rows = await this.repository.byCountry(filter);
    return { breakdown: toBreakdownRows(rows) };
  }
}
