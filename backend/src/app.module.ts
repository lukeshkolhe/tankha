import { Module } from '@nestjs/common';
import { PlatformModule } from './platform/platform.module';
import { AccessModule } from './access/access.module';
import { CompensationModule } from './compensation/compensation.module';
import { WorkforceModule } from './workforce/workforce.module';
import { DataExchangeModule } from './data-exchange/data-exchange.module';
import { InsightsModule } from './insights/insights.module';

/**
 * Application root. PlatformModule is @Global() (Prisma, tenancy, auth, config,
 * UnitOfWork). The six bounded contexts map 1:1 to the PRD modules.
 *
 * DataExchangeModule is imported before WorkforceModule so its literal
 * `/employees/export` and `/employees/sample-sheet` routes register ahead of
 * workforce's `/employees/:id`, which would otherwise shadow them (Express
 * matches routes in registration order, longest-literal-first is not automatic).
 */
@Module({
  imports: [
    PlatformModule,
    AccessModule,
    CompensationModule,
    DataExchangeModule,
    WorkforceModule,
    InsightsModule,
  ],
})
export class AppModule {}
