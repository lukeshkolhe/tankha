import { PageRequest, PaginatedResult } from 'src/platform';
import { Employee } from './employee.entity';
import { EmployeeSort } from './employee-sort';
import { EmployeeRowView, EmployeeView } from './read-models';

/** The whitelisted filter set for the employee list. */
export interface EmployeeListFilters {
  search?: string;
  departmentId?: string;
  designationId?: string;
  countryCode?: string;
  status?: string;
}

/** A fully-shaped list query: normalised filters + sort + page. */
export interface EmployeeListQuery {
  filters: EmployeeListFilters;
  sort: EmployeeSort;
  page: PageRequest;
}

/**
 * Persistence port for employees. Implemented by a tenant-scoped Prisma adapter;
 * write methods assume the caller's ambient transaction (so `create` can join
 * workforce's create-employee transaction alongside the compensation write).
 * `organisationId` is never a parameter — it comes only from `TenantContext`.
 */
export abstract class EmployeeRepository {
  /** Index-backed, filtered, sorted page of row projections (incl. salary total). */
  abstract findPaged(query: EmployeeListQuery): Promise<PaginatedResult<EmployeeRowView>>;

  /** Full detail view (attributes + current salary summary), or null if absent. */
  abstract findById(id: string): Promise<EmployeeView | null>;

  /** Reconstitute the aggregate for edit/lifecycle logic, or null if absent. */
  abstract findEntityById(id: string): Promise<Employee | null>;

  /** Insert a new employee and return its generated id. */
  abstract create(employee: Employee): Promise<string>;

  /** Persist changed attributes and/or status for an existing employee. */
  abstract update(employee: Employee): Promise<void>;

  /** Whether an employee already uses this code in the current organisation. */
  abstract existsByCode(employeeCode: string): Promise<boolean>;
}
