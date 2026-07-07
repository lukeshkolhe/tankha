import { Injectable } from '@nestjs/common';
import { TenantContext, UnitOfWork } from 'src/platform';
import { Employee } from 'src/workforce/domain/employee.entity';
import { EmployeeRepository } from 'src/workforce/domain/employee.repository';
import { SalaryRepository } from 'src/compensation/domain/salary.repository';
import { SalaryStructure } from 'src/compensation/domain/salary-structure.entity';
import { SalaryRevision } from 'src/compensation/domain/salary-revision.entity';
import { SalaryComponent } from 'src/compensation/domain/salary-component.vo';
import { EditSalaryUseCase } from 'src/compensation/application/edit-salary.usecase';
import { ImportReport } from '../domain/import-report';
import { FailedRow } from '../domain/failed-row';
import { SheetParser } from '../domain/sheet-parser';
import { CommitImportCommand } from './dto/data-exchange-commands';
import { ClassifiedRow, ImportClassifier, ResolvedRow } from './import-classifier';

/**
 * Phase 2 of import. Re-parses and re-validates the file against CURRENT DB
 * state (stateless — no server-side staging), then in one `UnitOfWork.run`:
 * batch-inserts every new row directly through `SalaryRepository.saveInitialMany`
 * (a handful of `createMany` round trips regardless of row count — the manual
 * single-employee use case doesn't scale to a 10k-row import over a networked
 * DB connection), and applies only the confirmed conflicts through
 * `EditSalaryUseCase` with an auto-remark, so every override is an audited
 * append-only revision. Partial success still returns a report.
 */
@Injectable()
export class CommitImportUseCase {
  constructor(
    private readonly parser: SheetParser,
    private readonly classifier: ImportClassifier,
    private readonly employees: EmployeeRepository,
    private readonly salaries: SalaryRepository,
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
    const resolvedRows = classified.filter(isNew).map((row) => row.resolved);
    if (resolvedRows.length === 0) {
      return 0;
    }

    const employees = resolvedRows.map((resolved) => Employee.create(resolved.attributes));
    const employeeIds = await this.employees.createMany(employees);

    const structures = resolvedRows.map((resolved, index) =>
      this.buildStructure(employeeIds[index], resolved),
    );
    const revisions = structures.map((structure) =>
      SalaryRevision.forInitial(structure, this.tenant.userId),
    );
    await this.salaries.saveInitialMany(structures, revisions);

    return resolvedRows.length;
  }

  private buildStructure(employeeId: string, resolved: ResolvedRow): SalaryStructure {
    const components = resolved.components.map((component) =>
      SalaryComponent.of(component.type, component.amountMinor, resolved.currencyCode),
    );
    return SalaryStructure.create(employeeId, this.tenant.organisationId, resolved.currencyCode, components);
  }

  private async applyConflicts(
    classified: ClassifiedRow[],
    applyCodes: Set<string>,
    remark: string,
  ): Promise<{ updated: number; skippedConflicts: number }> {
    const conflicts = classified.filter(isConflict);
    const confirmed = conflicts.filter((conflict) => applyCodes.has(conflict.row.employeeCode));
    for (const conflict of confirmed) {
      await this.applyConflict(conflict, remark);
    }
    return { updated: confirmed.length, skippedConflicts: conflicts.length - confirmed.length };
  }

  /**
   * A confirmed conflict applies the whole incoming row, not salary alone: the
   * preview diff shown to HR (see `computeChanges`) includes core attributes
   * like department/designation, so ticking the row must update both — the
   * attribute write and the audited salary revision.
   */
  private async applyConflict(conflict: Conflict, remark: string): Promise<void> {
    const employee = await this.employees.findEntityById(conflict.existing.id);
    if (employee) {
      await this.employees.update(employee.withAttributes(conflict.resolved.attributes));
    }
    await this.editSalary.execute({
      employeeId: conflict.existing.id,
      remark,
      components: conflict.resolved.components,
    });
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
