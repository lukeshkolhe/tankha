import { Injectable } from '@nestjs/common';
import { NotFoundError } from 'src/platform';
import { EmployeeRepository } from '../domain/employee.repository';
import { EmployeeView } from './dto/employee-commands';

/**
 * Returns full employee detail including the current salary summary, read via a
 * read-only join to the `SalaryStructure` projection — deliberately not a call
 * into `compensation`, so the detail view has no cross-module runtime dependency.
 */
@Injectable()
export class GetEmployeeUseCase {
  constructor(private readonly employees: EmployeeRepository) {}

  async execute(id: string): Promise<EmployeeView> {
    const view = await this.employees.findById(id);
    if (!view) {
      throw new NotFoundError(`Employee ${id} not found.`);
    }
    return view;
  }
}
