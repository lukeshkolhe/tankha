import { InMemoryReferenceRepository } from 'src/workforce/application/testing/in-memory-reference.repository';
import { SHEET_COLUMNS } from '../domain/sheet-parser';
import { EmployeeSnapshot } from '../domain/employee-snapshot.repository';
import { BuildSampleSheetUseCase } from './build-sample-sheet.usecase';
import { ExportEmployeesUseCase } from './export-employees.usecase';
import { FakeSheetParser, FakeSheetWriter } from './in-memory/fake-sheet';
import { InMemoryEmployeeSnapshotRepository } from './in-memory/in-memory-employee-snapshot.repository';

function snapshot(overrides: Partial<EmployeeSnapshot> = {}): EmployeeSnapshot {
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
    components: [{ type: 'BASIC', amountMinor: 8000000 }],
    salaryTotalMinor: 8000000,
    ...overrides,
  };
}

describe('BuildSampleSheetUseCase', () => {
  it('writes the exact import columns and round-trips through the parser', async () => {
    const writer = new FakeSheetWriter();

    const buffer = await new BuildSampleSheetUseCase(writer).execute('csv');
    const rows = await new FakeSheetParser().parse(buffer, 'csv');

    expect(writer.lastTable?.columns).toEqual([...SHEET_COLUMNS]);
    expect(rows).toHaveLength(2);
    expect(rows[0].employeeCode).toBe('EMP-1001');
    expect(rows[0].basic).toBe('80000');
  });
});

describe('ExportEmployeesUseCase', () => {
  function exportSheet(snapshots: EmployeeSnapshot[]) {
    const writer = new FakeSheetWriter();
    const usecase = new ExportEmployeesUseCase(
      new InMemoryEmployeeSnapshotRepository(snapshots),
      new InMemoryReferenceRepository(),
      writer,
    );
    return { writer, usecase };
  }

  it('streams the sample columns plus a read-only salaryTotal, amounts in major units', async () => {
    const { writer, usecase } = exportSheet([snapshot()]);

    await usecase.execute({ filters: {}, format: 'xlsx' });

    expect(writer.lastTable?.columns).toEqual([...SHEET_COLUMNS, 'salaryTotal']);
    expect(writer.lastTable?.rows[0]).toMatchObject({
      employeeCode: 'EMP-1001',
      basic: 80000,
      salaryTotal: 80000,
    });
  });

  it('applies the same filters as the employee list', async () => {
    const { writer, usecase } = exportSheet([
      snapshot({ employeeCode: 'IN-1', country: 'IN' }),
      snapshot({ employeeCode: 'US-1', country: 'US' }),
    ]);

    await usecase.execute({ filters: { countryCode: 'US' }, format: 'csv' });

    expect(writer.lastTable?.rows).toHaveLength(1);
    expect(writer.lastTable?.rows[0].employeeCode).toBe('US-1');
  });
});
