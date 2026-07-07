import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetOverviewUseCase } from '../application/get-overview.usecase';
import { GetDepartmentBreakdownUseCase } from '../application/get-department-breakdown.usecase';
import { GetCountryBreakdownUseCase } from '../application/get-country-breakdown.usecase';
import { InsightsFilterDto } from './dto/insights-filter.dto';

/**
 * Read-only dashboard endpoints. All are tenant-scoped and accept the shared
 * workforce filter set (no pagination). Every money figure is per-currency —
 * no response sums `totalMinor` across currencies (NFR-3).
 */
@ApiTags('insights')
@ApiBearerAuth()
@Controller('insights')
export class InsightsController {
  constructor(
    private readonly getOverview: GetOverviewUseCase,
    private readonly getDepartmentBreakdown: GetDepartmentBreakdownUseCase,
    private readonly getCountryBreakdown: GetCountryBreakdownUseCase,
  ) {}

  @Get('overview')
  @ApiOperation({ summary: 'Headcount + per-currency total/average (FR-5.1)' })
  overview(@Query() filter: InsightsFilterDto) {
    return this.getOverview.execute(filter);
  }

  @Get('by-department')
  @ApiOperation({ summary: 'Per-department, per-currency breakdown (FR-5.2)' })
  byDepartment(@Query() filter: InsightsFilterDto) {
    return this.getDepartmentBreakdown.execute(filter);
  }

  @Get('by-country')
  @ApiOperation({ summary: 'Per-country, per-currency breakdown (FR-5.2)' })
  byCountry(@Query() filter: InsightsFilterDto) {
    return this.getCountryBreakdown.execute(filter);
  }
}
