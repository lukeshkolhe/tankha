import { Injectable } from '@nestjs/common';
import { SalaryRepository } from '../domain/salary.repository';
import { SalaryStructure } from '../domain/salary-structure.entity';
import { SalaryComponent } from '../domain/salary-component.vo';
import { SalaryRevision } from '../domain/salary-revision.entity';
import { SetInitialSalaryInput } from './dto/salary-commands';

/**
 * Creates an employee's first salary structure and its initial (null-old)
 * revision. Deliberately does NOT open a UnitOfWork: it always runs inside the
 * caller's transaction (workforce create-employee / import), so its writes join
 * the ambient transaction via the repository adapter.
 */
@Injectable()
export class SetInitialSalaryUseCase {
  constructor(private readonly repository: SalaryRepository) {}

  async execute(input: SetInitialSalaryInput): Promise<void> {
    const structure = this.toStructure(input);
    const revision = SalaryRevision.forInitial(structure, input.changedByUserId);
    await this.repository.saveInitial(structure, revision);
  }

  private toStructure(input: SetInitialSalaryInput): SalaryStructure {
    const components = input.components.map((component) =>
      SalaryComponent.of(component.type, component.amountMinor, input.currencyCode),
    );
    return SalaryStructure.create(
      input.employeeId,
      input.organisationId,
      input.currencyCode,
      components,
    );
  }
}
