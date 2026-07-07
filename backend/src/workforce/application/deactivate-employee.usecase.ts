import { Injectable } from '@nestjs/common';
import { NotFoundError } from 'src/platform';
import { EmployeeRepository } from '../domain/employee.repository';
import { Employee } from '../domain/employee.entity';
import { EmployeeView } from './dto/employee-commands';

/**
 * Soft lifecycle transitions: deactivate flips status to INACTIVE and reactivate
 * restores ACTIVE. Both preserve the record and its salary history — nothing is
 * deleted (FR-2.1).
 */
@Injectable()
export class DeactivateEmployeeUseCase {
  constructor(private readonly employees: EmployeeRepository) {}

  deactivate(id: string): Promise<EmployeeView> {
    return this.transition(id, (employee) => employee.deactivate());
  }

  reactivate(id: string): Promise<EmployeeView> {
    return this.transition(id, (employee) => employee.reactivate());
  }

  private async transition(
    id: string,
    change: (employee: Employee) => Employee,
  ): Promise<EmployeeView> {
    const existing = await this.employees.findEntityById(id);
    if (!existing) {
      throw new NotFoundError(`Employee ${id} not found.`);
    }
    await this.employees.update(change(existing));
    return this.load(id);
  }

  private async load(id: string): Promise<EmployeeView> {
    const view = await this.employees.findById(id);
    if (!view) {
      throw new NotFoundError(`Employee ${id} not found.`);
    }
    return view;
  }
}
