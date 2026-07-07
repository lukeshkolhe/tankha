import { Injectable } from '@nestjs/common';
import { PageRequest, PaginatedResult } from 'src/platform';
import { SalaryRepository } from '../domain/salary.repository';
import { RevisionView } from './dto/salary-commands';

/** Returns an employee's newest-first, paged salary-change history (FR-3.3). */
@Injectable()
export class ListRevisionsUseCase {
  constructor(private readonly repository: SalaryRepository) {}

  execute(employeeId: string, page: PageRequest): Promise<PaginatedResult<RevisionView>> {
    return this.repository.listRevisions(employeeId, page);
  }
}
