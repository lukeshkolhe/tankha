import { EmployeeListFilters } from 'src/workforce/domain/employee.repository';
import { EmployeeSort } from 'src/workforce/domain/employee-sort';
import {
  EmployeeSnapshot,
  EmployeeSnapshotRepository,
} from '../../domain/employee-snapshot.repository';

/**
 * In-memory `EmployeeSnapshotRepository` for use-case unit tests: serves seeded
 * current-employee snapshots so conflict diffs and export can be exercised
 * without a database.
 */
export class InMemoryEmployeeSnapshotRepository extends EmployeeSnapshotRepository {
  private readonly snapshots: EmployeeSnapshot[];

  constructor(snapshots: EmployeeSnapshot[] = []) {
    super();
    this.snapshots = snapshots;
  }

  async findByCodes(codes: string[]): Promise<Map<string, EmployeeSnapshot>> {
    const wanted = new Set(codes);
    const found = this.snapshots.filter((snapshot) => wanted.has(snapshot.employeeCode));
    return new Map(found.map((snapshot) => [snapshot.employeeCode, snapshot]));
  }

  async findForExport(filters: EmployeeListFilters, _sort: EmployeeSort): Promise<EmployeeSnapshot[]> {
    return this.snapshots.filter((snapshot) => this.matches(snapshot, filters));
  }

  private matches(snapshot: EmployeeSnapshot, filters: EmployeeListFilters): boolean {
    if (filters.countryCode && snapshot.country !== filters.countryCode) {
      return false;
    }
    if (filters.search && !snapshot.employeeCode.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    return true;
  }
}
