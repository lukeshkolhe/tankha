import { InMemoryReferenceRepository, ReferenceSeed } from 'src/workforce/application/testing/in-memory-reference.repository';
import { EmployeeSnapshot } from '../domain/employee-snapshot.repository';
import { ImportClassifier } from './import-classifier';
import { PreviewImportUseCase } from './preview-import.usecase';
import { FakeSheetParser, encodeSheet } from './in-memory/fake-sheet';
import { InMemoryEmployeeSnapshotRepository } from './in-memory/in-memory-employee-snapshot.repository';

type SheetRecord = Record<string, string | number>;

function validRow(overrides: Partial<SheetRecord> = {}): SheetRecord {
  return {
    employeeCode: 'EMP-1001',
    firstName: 'Ravi',
    lastName: 'Kumar',
    department: 'Engineering',
    designation: 'Senior Engineer',
    country: 'IN',
    currency: 'INR',
    joinDate: '2021-04-01',
    basic: 100000,
    houseRentAllowance: 0,
    specialAllowance: 0,
    transportAllowance: 0,
    annualBonus: 0,
    ...overrides,
  };
}

function snapshot(overrides: Partial<EmployeeSnapshot>): EmployeeSnapshot {
  return {
    id: 'e1',
    employeeCode: 'EMP-1001',
    firstName: 'Ravi',
    lastName: 'Kumar',
    department: 'Engineering',
    designation: 'Senior Engineer',
    country: 'IN',
    currency: 'INR',
    joinDate: '2021-04-01',
    components: [],
    salaryTotalMinor: 0,
    ...overrides,
  };
}

function preview(records: SheetRecord[], snapshots: EmployeeSnapshot[] = [], seed?: ReferenceSeed) {
  const references = new InMemoryReferenceRepository(seed);
  const classifier = new ImportClassifier(references, new InMemoryEmployeeSnapshotRepository(snapshots));
  return new PreviewImportUseCase(new FakeSheetParser(), classifier).execute(encodeSheet(records), 'csv');
}

describe('PreviewImportUseCase', () => {
  it('counts a brand-new valid row as an insert', async () => {
    const result = await preview([validRow()]);

    expect(result.toInsert).toBe(1);
    expect(result.conflicts).toEqual([]);
    expect(result.invalid).toEqual([]);
  });

  it('flags an existing employeeCode as a conflict with a current→incoming diff incl. salary', async () => {
    const existing = snapshot({ designation: 'Engineer', salaryTotalMinor: 12000000 });

    const result = await preview([validRow({ designation: 'Senior Engineer' })], [existing]);

    expect(result.toInsert).toBe(0);
    expect(result.conflicts).toEqual([
      {
        rowNumber: 2,
        employeeCode: 'EMP-1001',
        changes: [
          { field: 'designation', current: 'Engineer', incoming: 'Senior Engineer' },
          { field: 'salaryTotal', current: 12000000, incoming: 10000000, currency: 'INR' },
        ],
      },
    ]);
  });

  it('rejects a duplicate employeeCode within the same file, keeping the first', async () => {
    const rows = [validRow({ employeeCode: 'DUP' }), validRow({ employeeCode: 'DUP', firstName: 'Other' })];

    const result = await preview(rows);

    expect(result.toInsert).toBe(1);
    expect(result.invalid).toEqual([
      { rowNumber: 3, employeeCode: 'DUP', reasons: ['Duplicate employee code within the uploaded file'] },
    ]);
  });

  it('rejects a row with an unknown reference and a negative amount, with reasons', async () => {
    const result = await preview([validRow({ employeeCode: 'BAD', department: 'Enginering', basic: -5 })]);

    expect(result.toInsert).toBe(0);
    expect(result.invalid).toHaveLength(1);
    expect(result.invalid[0].reasons).toEqual([
      "Unknown department 'Enginering'",
      'Negative amount for BASIC',
    ]);
  });

  it('converts major-unit component amounts to minor via minorUnitDigits', async () => {
    const seed: ReferenceSeed = {
      currencies: [
        { code: 'INR', name: 'Rupee', symbol: '₹', minorUnitDigits: 2 },
        { code: 'JPY', name: 'Yen', symbol: '¥', minorUnitDigits: 0 },
      ],
    };
    const inr = await preview(
      [validRow({ basic: 12.5 })],
      [snapshot({ salaryTotalMinor: 999 })],
      seed,
    );
    const jpy = await preview(
      [validRow({ currency: 'JPY', basic: 1000 })],
      [snapshot({ currency: 'JPY', salaryTotalMinor: 1 })],
      seed,
    );

    expect(inr.conflicts[0].changes).toContainEqual({
      field: 'salaryTotal',
      current: 999,
      incoming: 1250,
      currency: 'INR',
    });
    expect(jpy.conflicts[0].changes).toContainEqual({
      field: 'salaryTotal',
      current: 1,
      incoming: 1000,
      currency: 'JPY',
    });
  });
});
