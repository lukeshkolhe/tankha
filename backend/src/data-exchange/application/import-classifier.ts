import { Injectable } from '@nestjs/common';
import { EmployeeAttributes } from 'src/workforce/domain/employee.entity';
import {
  EmployeeValidation,
  EmployeeValidationInput,
  SalaryComponentInput,
} from 'src/workforce/domain/employee-validation';
import {
  ReferenceItem,
  ReferenceRepository,
  ValidReferences,
} from 'src/workforce/domain/reference.repository';
import { EmployeeRow } from '../domain/employee-row';
import { FieldChange } from '../domain/field-change';
import { COMPONENT_COLUMNS } from '../domain/sheet-parser';
import { toMinorUnits } from '../domain/currency-scale';
import {
  EmployeeSnapshot,
  EmployeeSnapshotRepository,
} from '../domain/employee-snapshot.repository';
import { computeChanges } from './conflict-changes';
import { describeValidationFailure, DUPLICATE_IN_FILE_REASON } from './failure-reasons';

/** A row resolved to the ids/minor amounts a compensation write needs. */
export interface ResolvedRow {
  attributes: EmployeeAttributes;
  currencyCode: string;
  components: SalaryComponentInput[];
  totalMinor: number;
}

/** The bucket a row falls into once validated against current DB state. */
export type ClassifiedRow =
  | { kind: 'new'; row: EmployeeRow; resolved: ResolvedRow }
  | {
      kind: 'conflict';
      row: EmployeeRow;
      resolved: ResolvedRow;
      existing: EmployeeSnapshot;
      changes: FieldChange[];
    }
  | { kind: 'invalid'; row: EmployeeRow; reasons: string[] };

interface ClassificationContext {
  references: ValidReferences;
  departmentIdByName: Map<string, string>;
  designationIdByName: Map<string, string>;
  minorUnitDigitsByCurrency: Map<string, number>;
  existing: Map<string, EmployeeSnapshot>;
}

/**
 * The heart of import: it resolves each parsed row (names → ids, major → minor),
 * runs the SAME `EmployeeValidation` as manual entry, and buckets rows into
 * new / conflict / invalid against current DB state. Shared verbatim by preview
 * (report the buckets) and commit (act on them), so the two can never disagree.
 */
@Injectable()
export class ImportClassifier {
  constructor(
    private readonly references: ReferenceRepository,
    private readonly snapshots: EmployeeSnapshotRepository,
  ) {}

  async classify(rows: EmployeeRow[]): Promise<ClassifiedRow[]> {
    const context = await this.loadContext(rows);
    const seenCodes = new Set<string>();
    return rows.map((row) => this.classifyRow(row, context, seenCodes));
  }

  private async loadContext(rows: EmployeeRow[]): Promise<ClassificationContext> {
    const [references, departments, designations, currencies, existing] = await Promise.all([
      this.references.loadValidReferences(),
      this.references.listDepartments(),
      this.references.listDesignations(),
      this.references.listCurrencies(),
      this.snapshots.findByCodes(codesOf(rows)),
    ]);
    return {
      references,
      departmentIdByName: nameToId(departments),
      designationIdByName: nameToId(designations),
      minorUnitDigitsByCurrency: currencyDigits(currencies),
      existing,
    };
  }

  private classifyRow(
    row: EmployeeRow,
    context: ClassificationContext,
    seenCodes: Set<string>,
  ): ClassifiedRow {
    if (isDuplicateInFile(row.employeeCode, seenCodes)) {
      return { kind: 'invalid', row, reasons: [DUPLICATE_IN_FILE_REASON] };
    }
    const resolved = this.resolve(row, context);
    const errors = EmployeeValidation.validate(toValidationInput(resolved), context.references, false);
    if (errors.length > 0) {
      return { kind: 'invalid', row, reasons: describeValidationFailure(errors, row, resolved.components) };
    }
    return this.bucketValid(row, resolved, context);
  }

  private bucketValid(
    row: EmployeeRow,
    resolved: ResolvedRow,
    context: ClassificationContext,
  ): ClassifiedRow {
    const existing = context.existing.get(row.employeeCode);
    if (!existing) {
      return { kind: 'new', row, resolved };
    }
    const changes = computeChanges(existing, row, resolved.totalMinor);
    return { kind: 'conflict', row, resolved, existing, changes };
  }

  private resolve(row: EmployeeRow, context: ClassificationContext): ResolvedRow {
    const digits = context.minorUnitDigitsByCurrency.get(row.currency) ?? 0;
    const components = COMPONENT_COLUMNS.map((mapping) => ({
      type: mapping.type,
      amountMinor: toMinorUnits(row[mapping.column], digits),
    }));
    return {
      attributes: this.resolveAttributes(row, context),
      currencyCode: row.currency,
      components,
      totalMinor: sumAmounts(components),
    };
  }

  private resolveAttributes(row: EmployeeRow, context: ClassificationContext): EmployeeAttributes {
    return {
      employeeCode: row.employeeCode,
      firstName: row.firstName,
      lastName: row.lastName,
      departmentId: context.departmentIdByName.get(row.department) ?? row.department,
      designationId: context.designationIdByName.get(row.designation) ?? row.designation,
      countryCode: row.country,
      currencyCode: row.currency,
      joinDate: row.joinDate,
    };
  }
}

function toValidationInput(resolved: ResolvedRow): EmployeeValidationInput {
  return { ...resolved.attributes, salaryComponents: resolved.components };
}

function isDuplicateInFile(code: string, seenCodes: Set<string>): boolean {
  if (code.trim() === '') {
    return false;
  }
  if (seenCodes.has(code)) {
    return true;
  }
  seenCodes.add(code);
  return false;
}

function codesOf(rows: EmployeeRow[]): string[] {
  return rows.map((row) => row.employeeCode).filter((code) => code.trim() !== '');
}

function nameToId(items: ReferenceItem[]): Map<string, string> {
  return new Map(items.map((item) => [item.name, item.id]));
}

function currencyDigits(currencies: { code: string; minorUnitDigits: number }[]): Map<string, number> {
  return new Map(currencies.map((currency) => [currency.code, currency.minorUnitDigits]));
}

function sumAmounts(components: SalaryComponentInput[]): number {
  return components.reduce((total, component) => total + component.amountMinor, 0);
}
