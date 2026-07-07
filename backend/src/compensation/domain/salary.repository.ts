import { PageRequest, PaginatedResult } from 'src/platform';
import { SalaryStructure } from './salary-structure.entity';
import { SalaryRevision } from './salary-revision.entity';
import { RevisionView, SalaryView } from './read-models';

/**
 * Persistence port for compensation. Implemented by a tenant-scoped Prisma
 * adapter in infrastructure; the application layer depends only on this
 * abstraction. Write methods assume they run inside the caller's UnitOfWork
 * (ambient transaction), so `saveInitial` can participate in workforce's
 * create-employee transaction without opening its own.
 */
export abstract class SalaryRepository {
  /** Reconstitute the current structure for edit logic, or null if none exists. */
  abstract findStructureByEmployee(employeeId: string): Promise<SalaryStructure | null>;

  /** Current-pay read model for the detail view, or null if none exists. */
  abstract getCurrentSalary(employeeId: string): Promise<SalaryView | null>;

  /** Insert structure + components + the initial (null-old) revision. */
  abstract saveInitial(structure: SalaryStructure, revision: SalaryRevision): Promise<void>;

  /**
   * Bulk variant of `saveInitial` for imports: inserts every structure (+
   * components) and every revision via a handful of batched `createMany` calls
   * instead of one round trip per employee. `structures[i]` and `revisions[i]`
   * must be the pair for the same employee, same order.
   */
  abstract saveInitialMany(
    structures: readonly SalaryStructure[],
    revisions: readonly SalaryRevision[],
  ): Promise<void>;

  /** Replace components + update cached total + append an edit revision. */
  abstract replaceStructure(structure: SalaryStructure, revision: SalaryRevision): Promise<void>;

  /** Newest-first paged history for an employee. */
  abstract listRevisions(
    employeeId: string,
    page: PageRequest,
  ): Promise<PaginatedResult<RevisionView>>;
}
