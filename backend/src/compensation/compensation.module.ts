import { Module } from '@nestjs/common';
import { SalaryRepository } from './domain/salary.repository';
import { PrismaSalaryRepository } from './infrastructure/prisma-salary.repository';
import { SetInitialSalaryUseCase } from './application/set-initial-salary.usecase';
import { EditSalaryUseCase } from './application/edit-salary.usecase';
import { GetSalaryUseCase } from './application/get-salary.usecase';
import { ListRevisionsUseCase } from './application/list-revisions.usecase';
import { SalaryController } from './interface/salary.controller';

/**
 * Salary & compensation. Exports SetInitialSalaryUseCase (called by workforce
 * create-employee, inside its transaction) and EditSalaryUseCase (called by the
 * importer for confirmed updates). Also exports SalaryRepository directly so the
 * importer's bulk-insert path can batch writes via `saveInitialMany` instead of
 * going through the single-employee use case once per row. Depends only on
 * platform.
 */
@Module({
  controllers: [SalaryController],
  providers: [
    { provide: SalaryRepository, useClass: PrismaSalaryRepository },
    SetInitialSalaryUseCase,
    EditSalaryUseCase,
    GetSalaryUseCase,
    ListRevisionsUseCase,
  ],
  exports: [SalaryRepository, SetInitialSalaryUseCase, EditSalaryUseCase],
})
export class CompensationModule {}
