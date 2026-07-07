import { Injectable } from '@nestjs/common';
import { NotFoundError, TenantContext, UnitOfWork } from 'src/platform';
import { SalaryRepository } from '../domain/salary.repository';
import { SalaryStructure } from '../domain/salary-structure.entity';
import { SalaryComponent } from '../domain/salary-component.vo';
import { SalaryRevision } from '../domain/salary-revision.entity';
import { EditSalaryInput, SalaryView } from './dto/salary-commands';

/**
 * Replaces an employee's salary components and appends an audited revision, all
 * in one transaction. The new total is recomputed server-side; the currency is
 * taken from the existing structure (never the input); the remark is enforced by
 * the SalaryRevision factory.
 */
@Injectable()
export class EditSalaryUseCase {
  constructor(
    private readonly repository: SalaryRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly tenant: TenantContext,
  ) {}

  execute(input: EditSalaryInput): Promise<SalaryView> {
    return this.unitOfWork.run(() => this.apply(input));
  }

  private async apply(input: EditSalaryInput): Promise<SalaryView> {
    const previous = await this.repository.findStructureByEmployee(input.employeeId);
    if (!previous) {
      throw new NotFoundError(`No salary structure for employee ${input.employeeId}.`);
    }
    const next = previous.withComponents(this.toComponents(input, previous.currencyCode));
    const revision = SalaryRevision.forEdit(previous, next, input.remark, this.tenant.userId);
    await this.repository.replaceStructure(next, revision);
    return this.toView(next);
  }

  private toComponents(input: EditSalaryInput, currencyCode: string): SalaryComponent[] {
    return input.components.map((component) =>
      SalaryComponent.of(component.type, component.amountMinor, currencyCode),
    );
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
}
