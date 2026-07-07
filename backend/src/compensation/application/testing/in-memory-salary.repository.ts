import { PageRequest, PaginatedResult } from 'src/platform';
import { SalaryRepository } from '../../domain/salary.repository';
import { SalaryStructure } from '../../domain/salary-structure.entity';
import { SalaryRevision } from '../../domain/salary-revision.entity';
import { RevisionView, SalaryView } from '../../domain/read-models';

/**
 * In-memory SalaryRepository for use-case unit tests. Stores the current
 * structure and an append-only revision list per employee, newest first.
 */
export class InMemorySalaryRepository extends SalaryRepository {
  private readonly structures = new Map<string, SalaryStructure>();
  private readonly revisions = new Map<string, SalaryRevision[]>();
  private sequence = 0;

  async findStructureByEmployee(employeeId: string): Promise<SalaryStructure | null> {
    return this.structures.get(employeeId) ?? null;
  }

  async getCurrentSalary(employeeId: string): Promise<SalaryView | null> {
    const structure = this.structures.get(employeeId);
    if (!structure) {
      return null;
    }
    return this.toView(structure);
  }

  async saveInitial(structure: SalaryStructure, revision: SalaryRevision): Promise<void> {
    this.structures.set(structure.employeeId, structure);
    this.appendRevision(revision);
  }

  async replaceStructure(structure: SalaryStructure, revision: SalaryRevision): Promise<void> {
    this.structures.set(structure.employeeId, structure);
    this.appendRevision(revision);
  }

  async listRevisions(
    employeeId: string,
    page: PageRequest,
  ): Promise<PaginatedResult<RevisionView>> {
    const all = (this.revisions.get(employeeId) ?? []).map((revision, index) =>
      this.toRevisionView(revision, index),
    );
    const pageRows = all.slice(page.skip, page.skip + page.take);
    return PaginatedResult.of(pageRows, all.length, page);
  }

  private appendRevision(revision: SalaryRevision): void {
    const existing = this.revisions.get(revision.employeeId) ?? [];
    this.revisions.set(revision.employeeId, [revision, ...existing]); // newest first
  }

  private toView(structure: SalaryStructure): SalaryView {
    return {
      employeeId: structure.employeeId,
      currency: structure.currencyCode,
      components: structure.components.map((component) => ({
        type: component.type,
        amountMinor: component.amountMinor,
      })),
      totalMinor: structure.totalMinor,
    };
  }

  private toRevisionView(revision: SalaryRevision, index: number): RevisionView {
    return {
      id: `rev_${this.sequence++}_${index}`,
      oldTotalMinor: revision.oldTotalMinor,
      newTotalMinor: revision.newTotalMinor,
      currency: revision.currencyCode,
      remark: revision.remark,
      changedBy: { id: revision.changedByUserId, name: revision.changedByUserId },
      createdAt: new Date(0).toISOString(),
      componentsSnapshot: revision.componentsSnapshot.map((component) => ({ ...component })),
    };
  }
}
