import { TenantContext, UnitOfWork } from 'src/platform';
import { InMemorySalaryRepository } from './testing/in-memory-salary.repository';
import { SetInitialSalaryUseCase } from './set-initial-salary.usecase';
import { EditSalaryUseCase } from './edit-salary.usecase';
import { GetSalaryUseCase } from './get-salary.usecase';
import { ListRevisionsUseCase } from './list-revisions.usecase';
import { PageRequest } from 'src/platform';
import { NegativeAmountError, MissingRemarkError } from '../domain/compensation.errors';

/** A UnitOfWork that runs its work immediately — no real transaction in unit tests. */
class ImmediateUnitOfWork extends UnitOfWork {
  run<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }
}

function tenant(userId: string): TenantContext {
  return { get userId() { return userId; }, get organisationId() { return 'org_1'; } } as TenantContext;
}

function setInitial(repo: InMemorySalaryRepository): Promise<void> {
  return new SetInitialSalaryUseCase(repo).execute({
    employeeId: 'emp_1',
    organisationId: 'org_1',
    currencyCode: 'INR',
    changedByUserId: 'usr_1',
    components: [
      { type: 'BASIC', amountMinor: 8000000 },
      { type: 'HOUSE_RENT_ALLOWANCE', amountMinor: 4000000 },
    ],
  });
}

describe('SetInitialSalaryUseCase', () => {
  it('creates the structure with a computed total and an initial null-old revision', async () => {
    const repo = new InMemorySalaryRepository();

    await setInitial(repo);

    const salary = await new GetSalaryUseCase(repo).execute('emp_1');
    expect(salary.totalMinor).toBe(12000000);
    expect(salary.currency).toBe('INR');

    const history = await new ListRevisionsUseCase(repo).execute('emp_1', PageRequest.from({}));
    expect(history.total).toBe(1);
    expect(history.data[0].oldTotalMinor).toBeNull();
    expect(history.data[0].newTotalMinor).toBe(12000000);
  });

  it('rejects a negative component amount', async () => {
    const repo = new InMemorySalaryRepository();

    await expect(
      new SetInitialSalaryUseCase(repo).execute({
        employeeId: 'emp_1',
        organisationId: 'org_1',
        currencyCode: 'INR',
        changedByUserId: 'usr_1',
        components: [{ type: 'BASIC', amountMinor: -5 }],
      }),
    ).rejects.toBeInstanceOf(NegativeAmountError);
  });
});

describe('EditSalaryUseCase', () => {
  function editUseCase(repo: InMemorySalaryRepository): EditSalaryUseCase {
    return new EditSalaryUseCase(repo, new ImmediateUnitOfWork(), tenant('usr_2'));
  }

  it('recomputes the total and appends an audited old→new revision', async () => {
    const repo = new InMemorySalaryRepository();
    await setInitial(repo);

    const updated = await editUseCase(repo).execute({
      employeeId: 'emp_1',
      remark: 'FY25 increment',
      components: [
        { type: 'BASIC', amountMinor: 9000000 },
        { type: 'HOUSE_RENT_ALLOWANCE', amountMinor: 4500000 },
      ],
    });

    expect(updated.totalMinor).toBe(13500000);

    const history = await new ListRevisionsUseCase(repo).execute('emp_1', PageRequest.from({}));
    expect(history.total).toBe(2);
    expect(history.data[0].oldTotalMinor).toBe(12000000); // newest first
    expect(history.data[0].newTotalMinor).toBe(13500000);
    expect(history.data[0].remark).toBe('FY25 increment');
    expect(history.data[0].changedBy.id).toBe('usr_2');
  });

  it('requires a remark on every edit (FR-3.3)', async () => {
    const repo = new InMemorySalaryRepository();
    await setInitial(repo);

    await expect(
      editUseCase(repo).execute({ employeeId: 'emp_1', remark: '  ', components: [{ type: 'BASIC', amountMinor: 9000000 }] }),
    ).rejects.toBeInstanceOf(MissingRemarkError);
  });

  it('keeps the currency of the existing structure regardless of new components', async () => {
    const repo = new InMemorySalaryRepository();
    await setInitial(repo);

    const updated = await editUseCase(repo).execute({
      employeeId: 'emp_1',
      remark: 'adjust',
      components: [{ type: 'BASIC', amountMinor: 10000000 }],
    });

    expect(updated.currency).toBe('INR');
  });

  it('fails when the employee has no salary structure', async () => {
    const repo = new InMemorySalaryRepository();

    await expect(
      editUseCase(repo).execute({ employeeId: 'ghost', remark: 'x', components: [{ type: 'BASIC', amountMinor: 1 }] }),
    ).rejects.toThrow();
  });
});
