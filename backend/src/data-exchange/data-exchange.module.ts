import { Module } from '@nestjs/common';
import { WorkforceModule } from 'src/workforce/workforce.module';
import { CompensationModule } from 'src/compensation/compensation.module';
import { SheetParser, SheetWriter } from './domain/sheet-parser';
import { EmployeeSnapshotRepository } from './domain/employee-snapshot.repository';
import { ImportClassifier } from './application/import-classifier';
import { PreviewImportUseCase } from './application/preview-import.usecase';
import { CommitImportUseCase } from './application/commit-import.usecase';
import { ExportEmployeesUseCase } from './application/export-employees.usecase';
import { BuildSampleSheetUseCase } from './application/build-sample-sheet.usecase';
import { ExcelJsSheetAdapter } from './infrastructure/exceljs-sheet.adapter';
import { FastCsvSheetAdapter } from './infrastructure/fast-csv-sheet.adapter';
import { FormatSheetParser, FormatSheetWriter } from './infrastructure/format-sheet.adapter';
import { PrismaImportRepository } from './infrastructure/prisma-import.repository';
import { DataExchangeController } from './interface/data-exchange.controller';

/**
 * The `data-exchange` bounded context: bulk import (preview → commit) and
 * filtered export. Owns no domain entity — it reuses `workforce`'s
 * `EmployeeValidation`/`EmployeeRepository`/`ReferenceRepository` and
 * `compensation`'s `SetInitialSalary`/`EditSalary` so import and manual entry can
 * never diverge. Binds the sheet ports to a format-dispatching exceljs/fast-csv
 * adapter pair.
 */
@Module({
  imports: [WorkforceModule, CompensationModule],
  controllers: [DataExchangeController],
  providers: [
    ExcelJsSheetAdapter,
    FastCsvSheetAdapter,
    { provide: SheetParser, useClass: FormatSheetParser },
    { provide: SheetWriter, useClass: FormatSheetWriter },
    { provide: EmployeeSnapshotRepository, useClass: PrismaImportRepository },
    ImportClassifier,
    PreviewImportUseCase,
    CommitImportUseCase,
    ExportEmployeesUseCase,
    BuildSampleSheetUseCase,
  ],
})
export class DataExchangeModule {}
