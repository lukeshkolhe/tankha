import { SalaryComponentInput } from 'src/workforce/domain/employee-validation';
import { EmployeeListFilters } from 'src/workforce/domain/employee.repository';
import { EmployeeSort } from 'src/workforce/domain/employee-sort';

/**
 * The current state of an employee, read for two data-exchange needs: the
 * field-level diff a conflicting import row is compared against, and the rows an
 * export streams. Reference values are the human-facing name (department,
 * designation) or ISO code (country, currency); component amounts are integer
 * minor units.
 */
export interface EmployeeSnapshot {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  department: string;
  designation: string;
  country: string;
  currency: string;
  joinDate: string;
  components: SalaryComponentInput[];
  salaryTotalMinor: number;
}

/**
 * The data-exchange read port over current employees — the reads workforce's
 * `EmployeeRepository` does not expose. `findByCodes` powers conflict diffs;
 * `findForExport` streams the filtered dataset. Tenant scope comes from the
 * adapter's `TenantContext`, never a parameter.
 */
export abstract class EmployeeSnapshotRepository {
  abstract findByCodes(codes: string[]): Promise<Map<string, EmployeeSnapshot>>;
  abstract findForExport(
    filters: EmployeeListFilters,
    sort: EmployeeSort,
  ): Promise<EmployeeSnapshot[]>;
}
