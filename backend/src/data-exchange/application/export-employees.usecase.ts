import { Injectable } from '@nestjs/common';
import { ReferenceRepository } from 'src/workforce/domain/reference.repository';
import { EmployeeSort } from 'src/workforce/domain/employee-sort';
import { EmployeeSnapshot, EmployeeSnapshotRepository } from '../domain/employee-snapshot.repository';
import {
  COMPONENT_COLUMNS,
  SALARY_TOTAL_COLUMN,
  SHEET_COLUMNS,
  SheetTable,
  SheetWriter,
} from '../domain/sheet-parser';
import { toMajorUnits } from '../domain/currency-scale';
import { ExportQuery } from './dto/data-exchange-commands';

/**
 * Streams the current, filtered dataset to a sheet whose columns match the
 * import sample exactly — component amounts back in MAJOR units, plus a
 * read-only `salaryTotal` — so an export can be edited and re-imported. Reuses
 * workforce's list filters; export is current-state only (no history).
 */
@Injectable()
export class ExportEmployeesUseCase {
  constructor(
    private readonly snapshots: EmployeeSnapshotRepository,
    private readonly references: ReferenceRepository,
    private readonly writer: SheetWriter,
  ) {}

  async execute(query: ExportQuery): Promise<Buffer> {
    const [employees, digits] = await Promise.all([
      this.snapshots.findForExport(query.filters, EmployeeSort.from(query.sort)),
      this.minorUnitDigits(),
    ]);
    const rows = employees.map((employee) => toSheetRow(employee, digits));
    return this.writer.write({ columns: exportColumns(), rows }, query.format);
  }

  private async minorUnitDigits(): Promise<Map<string, number>> {
    const currencies = await this.references.listCurrencies();
    return new Map(currencies.map((currency) => [currency.code, currency.minorUnitDigits]));
  }
}

function exportColumns(): string[] {
  return [...SHEET_COLUMNS, SALARY_TOTAL_COLUMN];
}

function toSheetRow(
  employee: EmployeeSnapshot,
  digits: Map<string, number>,
): Record<string, string | number> {
  const minorUnitDigits = digits.get(employee.currency) ?? 0;
  return {
    ...attributeCells(employee),
    ...componentCells(employee, minorUnitDigits),
    [SALARY_TOTAL_COLUMN]: toMajorUnits(employee.salaryTotalMinor, minorUnitDigits),
  };
}

function attributeCells(employee: EmployeeSnapshot): Record<string, string> {
  return {
    employeeCode: employee.employeeCode,
    firstName: employee.firstName,
    lastName: employee.lastName,
    department: employee.department,
    designation: employee.designation,
    country: employee.country,
    currency: employee.currency,
    joinDate: employee.joinDate,
  };
}

function componentCells(
  employee: EmployeeSnapshot,
  minorUnitDigits: number,
): Record<string, number> {
  const amountByType = new Map(employee.components.map((c) => [c.type, c.amountMinor]));
  return Object.fromEntries(
    COMPONENT_COLUMNS.map((mapping) => [
      mapping.column,
      toMajorUnits(amountByType.get(mapping.type) ?? 0, minorUnitDigits),
    ]),
  );
}
