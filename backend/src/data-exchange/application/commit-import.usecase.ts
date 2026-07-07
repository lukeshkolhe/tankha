import { Injectable } from '@nestjs/common';
import { TenantContext, UnitOfWork } from 'src/platform';
import { Employee } from 'src/workforce/domain/employee.entity';
import { EmployeeRepository } from 'src/workforce/domain/employee.repository';
import { SetInitialSalaryUseCase } from 'src/compensation/application/set-initial-salary.usecase';
import { EditSalaryUseCase } from 'src/compensation/application/edit-salary.usecase';
import { ImportReport } from '../domain/import-report';
import { FailedRow } from '../domain/failed-row';
import { SheetParser } from '../domain/sheet-parser';
import { CommitImportCommand } from './dto/data-exchange-commands';
import { ClassifiedRow, ImportClassifier, ResolvedRow } from './import-classifier';

/**
 * Phase 2 of import. Re-parses and re-validates the file against CURRENT DB
 * state (stateless — no server-side staging), then in one `UnitOfWork.run`:
 * creates new rows through the very same `SetInitialSalaryUseCase` manual entry
 * uses (so an initial revision is never skipped), and applies only the confirmed
 * conflicts through `EditSalaryUseCase` with an auto-remark, so every override is
 * an audited append-only revision. Partial success still returns a report.
 */
@Injectable()
export class CommitImportUseCase {
  constructor(
    private readonly parser: SheetParser,
    private readonly classifier: ImportClassifier,
    private readonly employees: EmployeeRepository,
    private readonly setInitialSalary: SetInitialSalaryUseCase,
    private readonly editSalary: EditSalaryUseCase,
    private readonly unitOfWork: UnitOfWork,
    private readonly tenant: TenantContext,
  ) {}

  async execute(command: CommitImportCommand): Promise<ImportReport> {
    const rows = await this.parser.parse(command.buffer, command.format);
    const classified = await this.classifier.classify(rows);
    const applyCodes = new Set(command.applyEmployeeCodes);
    const remark = autoRemark(command.filename);
    return this.unitOfWork.run(() => this.applyAll(classified, applyCodes, remark));
  }

  private async applyAll(
    classified: ClassifiedRow[],
    applyCodes: Set<string>,
    remark: string,
  ): Promise<ImportReport> {
    const failed = classified.filter(isInvalid).map(toFailedRow);
    const inserted = await this.insertNew(classified);
    const { updated, skippedConflicts } = await this.applyConflicts(classified, applyCodes, remark);
    return { inserted, updated, skippedConflicts, failed };
  }

  private async insertNew(classified: ClassifiedRow[]): Promise<number> {
    const newRows = classified.filter(isNew);
    for (const row of newRows) {
      await this.createEmployee(row.resolved);
    }
    return newRows.length;
  }

  private async createEmployee(resolved: ResolvedRow): Promise<void> {
    const employeeId = await this.employees.create(Employee.create(resolved.attributes));
    await this.setInitialSalary.execute({
      employeeId,
      organisationId: this.tenant.organisationId,
      currencyCode: resolved.currencyCode,
      changedByUserId: this.tenant.userId,
      components: resolved.components,
    });
  }

  private async applyConflicts(
    classified: ClassifiedRow[],
    applyCodes: Set<string>,
    remark: string,
  ): Promise<{ updated: number; skippedConflicts: number }> {
    const conflicts = classified.filter(isConflict);
    const confirmed = conflicts.filter((conflict) => applyCodes.has(conflict.row.employeeCode));
    for (const conflict of confirmed) {
      await this.editSalary.execute({
        employeeId: conflict.existing.id,
        remark,
        components: conflict.resolved.components,
      });
    }
    return { updated: confirmed.length, skippedConflicts: conflicts.length - confirmed.length };
  }
}

type NewRow = Extract<ClassifiedRow, { kind: 'new' }>;
type Conflict = Extract<ClassifiedRow, { kind: 'conflict' }>;
type Invalid = Extract<ClassifiedRow, { kind: 'invalid' }>;

function isNew(row: ClassifiedRow): row is NewRow {
  return row.kind === 'new';
}

function isConflict(row: ClassifiedRow): row is Conflict {
  return row.kind === 'conflict';
}

function isInvalid(row: ClassifiedRow): row is Invalid {
  return row.kind === 'invalid';
}

function toFailedRow(row: Invalid): FailedRow {
  return {
    rowNumber: row.row.rowNumber,
    employeeCode: row.row.employeeCode || undefined,
    reasons: row.reasons,
  };
}

function autoRemark(filename: string): string {
  return `Imported from ${filename} on ${new Date().toISOString().slice(0, 10)}`;
}
