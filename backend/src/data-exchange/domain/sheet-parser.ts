import { SalaryComponentType } from '@prisma/client';
import { EmployeeRow } from './employee-row';

/** The import/export sheet formats, chosen by content-type / file extension. */
export type SheetFormat = 'xlsx' | 'csv';

/**
 * The sheet columns, in their exact order. The import template, an export and
 * the sample sheet all share this header so an export can be edited and
 * re-imported without remapping.
 */
export const SHEET_COLUMNS = [
  'employeeCode',
  'firstName',
  'lastName',
  'department',
  'designation',
  'country',
  'currency',
  'joinDate',
  'basic',
  'houseRentAllowance',
  'specialAllowance',
  'transportAllowance',
  'annualBonus',
] as const;

/** The read-only total column an export appends; ignored on import. */
export const SALARY_TOTAL_COLUMN = 'salaryTotal';

/** The `EmployeeRow` keys that carry a component amount (always string cells). */
export type ComponentColumn =
  | 'basic'
  | 'houseRentAllowance'
  | 'specialAllowance'
  | 'transportAllowance'
  | 'annualBonus';

/**
 * The five component columns and the `SalaryComponentType` each maps to, in the
 * order they appear in the sheet. Import reads major-unit amounts from these;
 * export writes them back.
 */
export const COMPONENT_COLUMNS: ReadonlyArray<{
  column: ComponentColumn;
  type: SalaryComponentType;
}> = [
  { column: 'basic', type: SalaryComponentType.BASIC },
  { column: 'houseRentAllowance', type: SalaryComponentType.HOUSE_RENT_ALLOWANCE },
  { column: 'specialAllowance', type: SalaryComponentType.SPECIAL_ALLOWANCE },
  { column: 'transportAllowance', type: SalaryComponentType.TRANSPORT_ALLOWANCE },
  { column: 'annualBonus', type: SalaryComponentType.ANNUAL_BONUS },
];

/** A table handed to a `SheetWriter`: an ordered header plus its data rows. */
export interface SheetTable {
  columns: readonly string[];
  rows: ReadonlyArray<Record<string, string | number>>;
}

/** A raw cell record keyed by header, as any adapter reads a data row. */
export type SheetRecord = Record<string, string | number | null | undefined>;

/**
 * Builds a parsed `EmployeeRow` from a raw header-keyed record — the one mapping
 * every parser (exceljs, fast-csv, the test fake) shares. Reads only the known
 * columns via `Object.hasOwn`, so unexpected keys in an untrusted sheet are
 * ignored, and coerces every cell to the string the domain expects.
 */
export function rowFromRecord(record: SheetRecord, rowNumber: number): EmployeeRow {
  const cell = (key: (typeof SHEET_COLUMNS)[number]): string =>
    Object.hasOwn(record, key) ? String(record[key] ?? '').trim() : '';
  return {
    rowNumber,
    employeeCode: cell('employeeCode'),
    firstName: cell('firstName'),
    lastName: cell('lastName'),
    department: cell('department'),
    designation: cell('designation'),
    country: cell('country'),
    currency: cell('currency'),
    joinDate: cell('joinDate'),
    basic: cell('basic'),
    houseRentAllowance: cell('houseRentAllowance'),
    specialAllowance: cell('specialAllowance'),
    transportAllowance: cell('transportAllowance'),
    annualBonus: cell('annualBonus'),
  };
}

/**
 * Port that reads an uploaded buffer into parsed rows. Implemented by the
 * exceljs (.xlsx) and fast-csv (.csv) adapters; the application layer depends
 * only on this abstraction, never on a spreadsheet library.
 */
export abstract class SheetParser {
  abstract parse(buffer: Buffer, format: SheetFormat): Promise<EmployeeRow[]>;
}

/** Port that renders a table to a downloadable buffer (export + sample sheet). */
export abstract class SheetWriter {
  abstract write(table: SheetTable, format: SheetFormat): Promise<Buffer>;
}
