import { PaginatedResult } from 'src/platform';
import { EmployeeListQuery, EmployeeRepository } from '../../domain/employee.repository';
import { Employee } from '../../domain/employee.entity';
import { EmployeeRowView, EmployeeView, SalarySummaryView } from '../../domain/read-models';
import { EmployeeSortField } from '../../domain/employee-sort';

/**
 * In-memory EmployeeRepository for use-case unit tests. Stores reconstituted
 * aggregates keyed by a generated id, plus an optional per-employee salary
 * summary so list/detail projections can be exercised without a database.
 * Reference names default to their id unless supplied.
 */
export class InMemoryEmployeeRepository extends EmployeeRepository {
  private readonly employees = new Map<string, Employee>();
  private readonly salaries = new Map<string, SalarySummaryView>();
  private sequence = 0;

  constructor(private readonly referenceNames: Record<string, string> = {}) {
    super();
  }

  async create(employee: Employee): Promise<string> {
    const id = `emp_${++this.sequence}`;
    this.employees.set(id, Employee.reconstitute(id, this.attributesOf(employee), employee.status));
    return id;
  }

  async update(employee: Employee): Promise<void> {
    if (!employee.id) {
      return;
    }
    this.employees.set(employee.id, employee);
  }

  async existsByCode(employeeCode: string): Promise<boolean> {
    return [...this.employees.values()].some((employee) => employee.employeeCode === employeeCode);
  }

  async findEntityById(id: string): Promise<Employee | null> {
    return this.employees.get(id) ?? null;
  }

  async findById(id: string): Promise<EmployeeView | null> {
    const employee = this.employees.get(id);
    if (!employee) {
      return null;
    }
    return this.toView(employee, id);
  }

  async findPaged(query: EmployeeListQuery): Promise<PaginatedResult<EmployeeRowView>> {
    const matched = [...this.employees.entries()].filter(([, e]) => this.matches(e, query));
    const sorted = matched.sort(([, a], [, b]) => this.compare(a, b, query));
    const rows = sorted.map(([id, employee]) => this.toRow(employee, id));
    const paged = rows.slice(query.page.skip, query.page.skip + query.page.take);
    return PaginatedResult.of(paged, rows.length, query.page);
  }

  /** Test hook: attach a current-salary summary to a stored employee. */
  recordSalary(employeeId: string, summary: SalarySummaryView): void {
    this.salaries.set(employeeId, summary);
  }

  private matches(employee: Employee, query: EmployeeListQuery): boolean {
    const { filters } = query;
    if (filters.status && employee.status !== filters.status) return false;
    if (filters.departmentId && employee.departmentId !== filters.departmentId) return false;
    if (filters.designationId && employee.designationId !== filters.designationId) return false;
    if (filters.countryCode && employee.countryCode !== filters.countryCode) return false;
    return this.matchesSearch(employee, filters.search);
  }

  private matchesSearch(employee: Employee, search?: string): boolean {
    if (!search) return true;
    const needle = search.toLowerCase();
    const haystack = [employee.firstName, employee.lastName, employee.employeeCode];
    return haystack.some((value) => value.toLowerCase().includes(needle));
  }

  private compare(a: Employee, b: Employee, query: EmployeeListQuery): number {
    const direction = query.sort.direction === 'desc' ? -1 : 1;
    return this.rank(a, b, query.sort.field) * direction;
  }

  private rank(a: Employee, b: Employee, field: EmployeeSortField): number {
    if (field === 'joinDate') return a.joinDate.localeCompare(b.joinDate);
    if (field === 'salaryTotal') return this.totalOf(a) - this.totalOf(b);
    return a.lastName.localeCompare(b.lastName);
  }

  private totalOf(employee: Employee): number {
    return employee.id ? (this.salaries.get(employee.id)?.totalMinor ?? 0) : 0;
  }

  private toRow(employee: Employee, id: string): EmployeeRowView {
    return {
      id,
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName,
      department: this.nameOf(employee.departmentId),
      designation: this.nameOf(employee.designationId),
      country: employee.countryCode,
      currency: employee.currencyCode,
      status: employee.status,
      joinDate: employee.joinDate,
      salaryTotalMinor: this.salaries.get(id)?.totalMinor ?? null,
    };
  }

  private toView(employee: Employee, id: string): EmployeeView {
    return {
      id,
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName,
      department: { id: employee.departmentId, name: this.nameOf(employee.departmentId) },
      designation: { id: employee.designationId, name: this.nameOf(employee.designationId) },
      countryCode: employee.countryCode,
      currencyCode: employee.currencyCode,
      status: employee.status,
      joinDate: employee.joinDate,
      salary: this.salaries.get(id) ?? null,
    };
  }

  private nameOf(id: string): string {
    return this.referenceNames[id] ?? id;
  }

  private attributesOf(employee: Employee) {
    return {
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName,
      departmentId: employee.departmentId,
      designationId: employee.designationId,
      countryCode: employee.countryCode,
      currencyCode: employee.currencyCode,
      joinDate: employee.joinDate,
    };
  }
}
