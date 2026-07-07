import { Injectable } from '@nestjs/common';
import { SHEET_COLUMNS, SheetFormat, SheetTable, SheetWriter } from '../domain/sheet-parser';

/**
 * The downloadable template: the exact import columns pre-filled with a few
 * valid example rows (component amounts in MAJOR units, references by
 * name/code), so it is importable as-is. The 10k seed file is the same format,
 * just larger — importing it exercises this very pipeline at scale.
 */
@Injectable()
export class BuildSampleSheetUseCase {
  constructor(private readonly writer: SheetWriter) {}

  execute(format: SheetFormat): Promise<Buffer> {
    return this.writer.write({ columns: [...SHEET_COLUMNS], rows: SAMPLE_ROWS }, format);
  }
}

const SAMPLE_ROWS: ReadonlyArray<Record<string, string | number>> = [
  {
    employeeCode: 'EMP-1001',
    firstName: 'Ravi',
    lastName: 'Kumar',
    department: 'Engineering',
    designation: 'Senior Engineer',
    country: 'IN',
    currency: 'INR',
    joinDate: '2021-04-01',
    basic: 80000,
    houseRentAllowance: 40000,
    specialAllowance: 20000,
    transportAllowance: 10000,
    annualBonus: 120000,
  },
  {
    employeeCode: 'EMP-1002',
    firstName: 'Meera',
    lastName: 'Nair',
    department: 'Engineering',
    designation: 'Senior Engineer',
    country: 'IN',
    currency: 'INR',
    joinDate: '2022-07-15',
    basic: 95000,
    houseRentAllowance: 47500,
    specialAllowance: 25000,
    transportAllowance: 12000,
    annualBonus: 150000,
  },
];
