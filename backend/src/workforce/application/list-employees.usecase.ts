import { Injectable } from '@nestjs/common';
import { PageRequest, PaginatedResult } from 'src/platform';
import { EmployeeRepository, EmployeeListQuery } from '../domain/employee.repository';
import { EmployeeSort } from '../domain/employee-sort';
import { EmployeeRowView } from '../domain/read-models';
import { ListEmployeesQuery } from './dto/employee-commands';

/**
 * Server-paginated, filtered and searched employee list. Raw query params are
 * normalised into a whitelisted `EmployeeListQuery` (safe sort + filters + page)
 * before the tenant-scoped, index-backed repository runs the query.
 */
@Injectable()
export class ListEmployeesUseCase {
  constructor(private readonly employees: EmployeeRepository) {}

  execute(query: ListEmployeesQuery): Promise<PaginatedResult<EmployeeRowView>> {
    return this.employees.findPaged(toListQuery(query));
  }
}

function toListQuery(query: ListEmployeesQuery): EmployeeListQuery {
  return {
    filters: {
      search: query.search,
      departmentId: query.department,
      designationId: query.designation,
      countryCode: query.country,
      status: query.status,
    },
    sort: EmployeeSort.from(query.sort),
    page: PageRequest.from(query),
  };
}
