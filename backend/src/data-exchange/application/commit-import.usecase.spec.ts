import { TenantContext, UnitOfWork } from 'src/platform';
import { InMemoryReferenceRepository, ReferenceSeed } from 'src/workforce/application/testing/in-memory-reference.repository';
import { InMemoryEmployeeRepository } from 'src/workforce/application/testing/in-memory-employee.repository';
import { Employee } from 'src/workforce/domain/employee.entity';
import { InMemorySalaryRepository } from 'src/compensation/application/testing/in-memory-salary.repository';
import { EditSalaryUseCase } from 'src/compensation/application/edit-salary.usecase';
import { EditSalaryInput } from 'src/compensation/application/dto/salary-commands';
import { EmployeeSnapshot } from '../domain/employee-snapshot.repository';
import { ImportClassifier } from './import-classifier';
import { CommitImportUseCase } from './commit-import.usecase';
import { FakeSheetParser, encodeSheet } from './in-memory/fake-sheet';
import { InMemoryEmployeeSnapshotRepository } from './in-memory/in-memory-employee-snapshot.repository';

type SheetRecord = Record<string, string | number>;

class ImmediateUnitOfWork extends UnitOfWork {
  run<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }
}

class StubEditSalary {
  readonly calls: EditSalaryInput[] = [];
  async execute(input: EditSalaryInput): Promise<void> {
    this.calls.push(input);
  }
}

function tenant(): TenantContext {
  return { get userId() { return 'usr_1'; }, get organisationId() { return 'org_1'; } } as TenantContext;
}

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
    basic: 80000,
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

interface Harness {
  usecase: CommitImportUseCase;
  salaries: InMemorySalaryRepository;
  editSalary: StubEditSalary;
  employees: InMemoryEmployeeRepository;
}

function harness(
  snapshots: EmployeeSnapshot[] = [],
  seed?: ReferenceSeed,
  employees: InMemoryEmployeeRepository = new InMemoryEmployeeRepository(),
): Harness {
  const references = new InMemoryReferenceRepository(seed);
  const classifier = new ImportClassifier(references, new InMemoryEmployeeSnapshotRepository(snapshots));
  const salaries = new InMemorySalaryRepository();
  const editSalary = new StubEditSalary();
  const usecase = new CommitImportUseCase(
    new FakeSheetParser(),
    classifier,
    employees,
    salaries,
    editSalary as unknown as EditSalaryUseCase,
    new ImmediateUnitOfWork(),
    tenant(),
  );
  return { usecase, salaries, editSalary, employees };
}

function run(h: Harness, records: SheetRecord[], applyEmployeeCodes: string[] = []) {
  return h.usecase.execute({ buffer: encodeSheet(records), format: 'csv', filename: 'test.csv', applyEmployeeCodes });
}

describe('CommitImportUseCase', () => {
  it('inserts new rows with minor-unit components via the batched salary write', async () => {
    const h = harness();

    const report = await run(h, [validRow()]);

    expect(report).toEqual({ inserted: 1, updated: 0, skippedConflicts: 0, failed: [] });
    const salary = await h.salaries.getCurrentSalary('emp_1');
    expect(salary?.currency).toBe('INR');
    expect(salary?.components).toContainEqual({ type: 'BASIC', amountMinor: 8000000 });
  });

  it('converts each currency by its own minorUnitDigits', async () => {
    const seed: ReferenceSeed = {
      currencies: [
        { code: 'INR', name: 'Rupee', symbol: '₹', minorUnitDigits: 2 },
        { code: 'JPY', name: 'Yen', symbol: '¥', minorUnitDigits: 0 },
      ],
    };
    const h = harness([], seed);

    await run(h, [
      validRow({ employeeCode: 'A', basic: 12.5 }),
      validRow({ employeeCode: 'B', currency: 'JPY', basic: 1000 }),
    ]);

    const salaryA = await h.salaries.getCurrentSalary('emp_1');
    const salaryB = await h.salaries.getCurrentSalary('emp_2');
    expect(salaryA?.components).toContainEqual({ type: 'BASIC', amountMinor: 1250 });
    expect(salaryB?.components).toContainEqual({ type: 'BASIC', amountMinor: 1000 });
  });

  it('updates only the confirmed conflicts via EditSalary, skipping the rest', async () => {
    const snapshots = [
      snapshot({ id: 'e1', employeeCode: 'EMP-1', salaryTotalMinor: 1 }),
      snapshot({ id: 'e2', employeeCode: 'EMP-2', salaryTotalMinor: 1 }),
    ];
    const h = harness(snapshots);

    const report = await run(
      h,
      [validRow({ employeeCode: 'EMP-1' }), validRow({ employeeCode: 'EMP-2' })],
      ['EMP-1'],
    );

    expect(report).toEqual({ inserted: 0, updated: 1, skippedConflicts: 1, failed: [] });
    expect(h.editSalary.calls).toHaveLength(1);
    expect(h.editSalary.calls[0].employeeId).toBe('e1');
    expect(h.editSalary.calls[0].remark).toMatch(/^Imported from test\.csv on \d{4}-\d{2}-\d{2}$/);
  });

  it('applies the confirmed row\'s attribute changes (e.g. designation), not salary alone', async () => {
    const seed: ReferenceSeed = {
      departments: [{ id: 'dep_1', name: 'Engineering' }],
      designations: [
        { id: 'des_1', name: 'Senior Engineer' },
        { id: 'des_2', name: 'Director' },
      ],
    };
    const employees = new InMemoryEmployeeRepository();
    const employeeId = await employees.create(
      Employee.create({
        employeeCode: 'EMP-1',
        firstName: 'Ravi',
        lastName: 'Kumar',
        departmentId: 'dep_1',
        designationId: 'des_2', // Director — the incoming row says Senior Engineer
        countryCode: 'IN',
        currencyCode: 'INR',
        joinDate: '2021-04-01',
      }),
    );
    const h = harness(
      [snapshot({ id: employeeId, employeeCode: 'EMP-1', designation: 'Director' })],
      seed,
      employees,
    );

    await run(h, [validRow({ employeeCode: 'EMP-1' })], ['EMP-1']);

    const updated = await employees.findEntityById(employeeId);
    expect(updated?.designationId).toBe('des_1'); // Senior Engineer, per the confirmed row
  });

  it('re-validates against current DB: a code that became non-new is a skipped conflict, not a blind insert', async () => {
    const h = harness([snapshot({ id: 'e9', employeeCode: 'EMP-9' })]);

    const report = await run(h, [validRow({ employeeCode: 'EMP-9' })], []);

    expect(report).toEqual({ inserted: 0, updated: 0, skippedConflicts: 1, failed: [] });
    expect(h.editSalary.calls).toHaveLength(0);
  });

  it('commits valid rows and still reports the failures (partial success)', async () => {
    const h = harness();

    const report = await run(h, [
      validRow({ employeeCode: 'OK' }),
      validRow({ employeeCode: 'BAD', department: 'Nope' }),
    ]);

    expect(report.inserted).toBe(1);
    expect(report.updated).toBe(0);
    expect(report.failed).toEqual([
      { rowNumber: 3, employeeCode: 'BAD', reasons: ["Unknown department 'Nope'"] },
    ]);
    const salary = await h.salaries.getCurrentSalary('emp_1');
    expect(salary).not.toBeNull();
  });
});
