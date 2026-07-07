import { Injectable } from '@nestjs/common';
import { NotFoundError } from 'src/platform';
import { SalaryRepository } from '../domain/salary.repository';
import { SalaryView } from './dto/salary-commands';

/** Returns an employee's current pay (components + computed total, per currency). */
@Injectable()
export class GetSalaryUseCase {
  constructor(private readonly repository: SalaryRepository) {}

  async execute(employeeId: string): Promise<SalaryView> {
    const salary = await this.repository.getCurrentSalary(employeeId);
    if (!salary) {
      throw new NotFoundError(`No salary structure for employee ${employeeId}.`);
    }
    return salary;
  }
}
