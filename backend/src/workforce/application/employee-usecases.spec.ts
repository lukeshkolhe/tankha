import { TenantContext, UnitOfWork } from 'src/platform';
import { SetInitialSalaryUseCase } from 'src/compensation/application/set-initial-salary.usecase';
import { SetInitialSalaryInput } from 'src/compensation/application/dto/salary-commands';
import { InMemoryEmployeeRepository } from './testing/in-memory-employee.repository';
import { InMemoryReferenceRepository } from './testing/in-memory-reference.repository';
import { CreateEmployeeUseCase } from './create-employee.usecase';
import { UpdateEmployeeUseCase } from './update-employee.usecase';
import { DeactivateEmployeeUseCase } from './deactivate-employee.usecase';
import { ListEmployeesUseCase } from './list-employees.usecase';
import { CreateEmployeeCommand } from './dto/employee-commands';
import { Employee } from '../domain/employee.entity';
import { DuplicateEmployeeCodeError, InvalidReferenceError } from '../domain/workforce.errors';

/** A UnitOfWork that runs its work immediately and exposes whether it is active. */
class TrackingUnitOfWork extends UnitOfWork {
  active = false;

  async run<T>(work: () => Promise<T>): Promise<T> {
    this.active = true;
    try {
      return await work();
    } finally {
      this.active = false;
    }
  }
}

/** Records each SetInitialSalary call and whether it happened inside the tx. */
class StubSetInitialSalary {
  readonly calls: SetInitialSalaryInput[] = [];
  insideTx = false;

  constructor(private readonly unitOfWork: TrackingUnitOfWork) {}

  async execute(input: SetInitialSalaryInput): Promise<void> {
    this.calls.push(input);
    this.insideTx = this.unitOfWork.active;
  }
}

function tenant(): TenantContext {
  return {
    get userId() {
      return 'usr_1';
    },
    get organisationId() {
      return 'org_1';
    },
  } as TenantContext;
}

function command(overrides: Partial<CreateEmployeeCommand> = {}): CreateEmployeeCommand {
  return {
    employeeCode: 'EMP-1001',
    firstName: 'Ravi',
    lastName: 'Kumar',
    departmentId: 'dep_1',
    designationId: 'des_1',
    countryCode: 'IN',
    currencyCode: 'INR',
    joinDate: '2021-04-01',
    salary: { components: [{ type: 'BASIC', amountMinor: 8000000 }] },
    ...overrides,
  };
}

interface Harness {
  employees: InMemoryEmployeeRepository;
  create: CreateEmployeeUseCase;
  salary: StubSetInitialSalary;
  unitOfWork: TrackingUnitOfWork;
}

function harness(): Harness {
  const employees = new InMemoryEmployeeRepository();
  const references = new InMemoryReferenceRepository();
  const unitOfWork = new TrackingUnitOfWork();
  const salary = new StubSetInitialSalary(unitOfWork);
  const create = new CreateEmployeeUseCase(
    employees,
    references,
    salary as unknown as SetInitialSalaryUseCase,
    unitOfWork,
    tenant(),
  );
  return { employees, create, salary, unitOfWork };
}

describe('CreateEmployeeUseCase', () => {
  it('creates the employee and delegates the initial salary once, inside the transaction', async () => {
    const { create, salary } = harness();

    const view = await create.execute(command());

    expect(view.employeeCode).toBe('EMP-1001');
    expect(view.status).toBe('ACTIVE');
    expect(salary.calls).toHaveLength(1);
    expect(salary.calls[0]).toEqual({
      employeeId: view.id,
      organisationId: 'org_1',
      currencyCode: 'INR',
      changedByUserId: 'usr_1',
      components: [{ type: 'BASIC', amountMinor: 8000000 }],
    });
    expect(salary.insideTx).toBe(true);
  });

  it('rejects a duplicate employee code with a 409 error and no salary write', async () => {
    const { create, salary } = harness();
    await create.execute(command());

    await expect(create.execute(command())).rejects.toBeInstanceOf(DuplicateEmployeeCodeError);
    expect(salary.calls).toHaveLength(1);
  });

  it('rejects an unknown reference id', async () => {
    const { create } = harness();

    await expect(create.execute(command({ departmentId: 'ghost' }))).rejects.toBeInstanceOf(
      InvalidReferenceError,
    );
  });
});

describe('UpdateEmployeeUseCase', () => {
  it('changes attributes without touching the salary', async () => {
    const { employees, create } = harness();
    const created = await create.execute(command());
    employees.recordSalary(created.id, {
      currency: 'INR',
      totalMinor: 8000000,
      components: [{ type: 'BASIC', amountMinor: 8000000 }],
    });
    const update = new UpdateEmployeeUseCase(employees, new InMemoryReferenceRepository(), new TrackingUnitOfWork());

    const view = await update.execute(created.id, { firstName: 'Ravindra' });

    expect(view.firstName).toBe('Ravindra');
    expect(view.lastName).toBe('Kumar');
    expect(view.salary).toEqual({
      currency: 'INR',
      totalMinor: 8000000,
      components: [{ type: 'BASIC', amountMinor: 8000000 }],
    });
  });
});

describe('DeactivateEmployeeUseCase', () => {
  it('flips status to INACTIVE and preserves the record, then reactivates', async () => {
    const { employees, create } = harness();
    const created = await create.execute(command());
    const lifecycle = new DeactivateEmployeeUseCase(employees);

    const deactivated = await lifecycle.deactivate(created.id);
    expect(deactivated.status).toBe('INACTIVE');
    expect(await employees.findById(created.id)).not.toBeNull();

    const reactivated = await lifecycle.reactivate(created.id);
    expect(reactivated.status).toBe('ACTIVE');
  });
});

describe('ListEmployeesUseCase', () => {
  function seed(employees: InMemoryEmployeeRepository, attrs: Partial<Employee> & { employeeCode: string; lastName: string }): Promise<string> {
    return employees.create(
      Employee.create({
        employeeCode: attrs.employeeCode,
        firstName: 'First',
        lastName: attrs.lastName,
        departmentId: (attrs as { departmentId?: string }).departmentId ?? 'dep_1',
        designationId: 'des_1',
        countryCode: 'IN',
        currencyCode: 'INR',
        joinDate: '2021-04-01',
      }),
    );
  }

  it('applies filter, search, sort and returns the pagination envelope', async () => {
    const employees = new InMemoryEmployeeRepository();
    await seed(employees, { employeeCode: 'E1', lastName: 'Zubin', departmentId: 'dep_1' });
    await seed(employees, { employeeCode: 'E2', lastName: 'Anand', departmentId: 'dep_1' });
    await seed(employees, { employeeCode: 'E3', lastName: 'Other', departmentId: 'dep_2' });
    const list = new ListEmployeesUseCase(employees);

    const result = await list.execute({ department: 'dep_1', sort: 'lastName:asc', pageSize: '1', page: '1' });

    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].lastName).toBe('Anand');
  });

  it('searches on name and employee code, case-insensitively', async () => {
    const employees = new InMemoryEmployeeRepository();
    await seed(employees, { employeeCode: 'ABC-9', lastName: 'Kumar' });
    await seed(employees, { employeeCode: 'XYZ-1', lastName: 'Sharma' });
    const list = new ListEmployeesUseCase(employees);

    const result = await list.execute({ search: 'abc' });

    expect(result.total).toBe(1);
    expect(result.data[0].employeeCode).toBe('ABC-9');
  });
});
