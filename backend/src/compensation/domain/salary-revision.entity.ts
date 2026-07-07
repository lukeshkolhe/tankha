import { SalaryComponentType } from '@prisma/client';
import { MissingRemarkError } from './compensation.errors';
import { SalaryStructure } from './salary-structure.entity';

/** A frozen picture of one component at the moment a revision was recorded. */
export interface RevisionComponent {
  type: SalaryComponentType;
  amountMinor: number;
}

const INITIAL_REMARK = 'Initial salary on creation';

/**
 * An append-only audit record of a salary change: the old and new totals, a
 * snapshot of the components, the reason, and who made it. Constructed only via
 * the two factories, so an edit revision can never exist without a remark and an
 * initial revision always has a null `oldTotalMinor`.
 */
export class SalaryRevision {
  private constructor(
    readonly employeeId: string,
    readonly organisationId: string,
    readonly currencyCode: string,
    readonly oldTotalMinor: number | null,
    readonly newTotalMinor: number,
    readonly componentsSnapshot: readonly RevisionComponent[],
    readonly remark: string,
    readonly changedByUserId: string,
  ) {}

  static forInitial(structure: SalaryStructure, changedByUserId: string): SalaryRevision {
    return SalaryRevision.of(null, structure, INITIAL_REMARK, changedByUserId);
  }

  static forEdit(
    previous: SalaryStructure,
    next: SalaryStructure,
    remark: string,
    changedByUserId: string,
  ): SalaryRevision {
    if (!remark || remark.trim().length === 0) {
      throw new MissingRemarkError();
    }
    return SalaryRevision.of(previous.totalMinor, next, remark, changedByUserId);
  }

  private static of(
    oldTotalMinor: number | null,
    structure: SalaryStructure,
    remark: string,
    changedByUserId: string,
  ): SalaryRevision {
    return new SalaryRevision(
      structure.employeeId,
      structure.organisationId,
      structure.currencyCode,
      oldTotalMinor,
      structure.totalMinor,
      structure.components.map((component) => ({ type: component.type, amountMinor: component.amountMinor })),
      remark,
      changedByUserId,
    );
  }
}
