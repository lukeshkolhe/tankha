import { Module } from '@nestjs/common';
import { InsightRepository } from './domain/insight.repository';
import { PrismaInsightRepository } from './infrastructure/prisma-insight.repository';
import { GetOverviewUseCase } from './application/get-overview.usecase';
import { GetDepartmentBreakdownUseCase } from './application/get-department-breakdown.usecase';
import { GetCountryBreakdownUseCase } from './application/get-country-breakdown.usecase';
import { InsightsController } from './interface/insights.controller';

/**
 * Read-only dashboard & analytics. Owns no tables; it aggregates the tenant's
 * employees joined to their salary structures, always grouped by currency.
 * Depends only on platform.
 */
@Module({
  controllers: [InsightsController],
  providers: [
    { provide: InsightRepository, useClass: PrismaInsightRepository },
    GetOverviewUseCase,
    GetDepartmentBreakdownUseCase,
    GetCountryBreakdownUseCase,
  ],
})
export class InsightsModule {}
