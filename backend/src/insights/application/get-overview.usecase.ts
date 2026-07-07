import { Injectable } from '@nestjs/common';
import { InsightRepository, InsightsFilter } from '../domain/insight.repository';
import { toCurrencyGroups } from '../domain/pay-insight';
import { OverviewView } from './dto/insights-views';

/** Headcount + per-currency total/average for the filtered workforce (FR-5.1). */
@Injectable()
export class GetOverviewUseCase {
  constructor(private readonly repository: InsightRepository) {}

  async execute(filter: InsightsFilter): Promise<OverviewView> {
    const byCurrency = toCurrencyGroups(await this.repository.overview(filter));
    const headcount = byCurrency.reduce((running, group) => running + group.headcount, 0);
    return { headcount, byCurrency };
  }
}
