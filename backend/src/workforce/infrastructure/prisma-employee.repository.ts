import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EmployeeStatus, Prisma } from '@prisma/client';
import { PaginatedResult, PrismaService, TenantContext } from 'src/platform';
import { EmployeeListQuery, EmployeeRepository } from '../domain/employee.repository';
import { Employee } from '../domain/employee.entity';
import { EmployeeSort } from '../domain/employee-sort';
import { EmployeeRowView, EmployeeView, SalarySummaryView } from '../domain/read-models';

type StructureRow = { currencyCode: string; totalMinor: number } | null;

// Postgres allows ~65535 bind parameters per statement; each employee row
// binds ~10 columns, so this stays comfortably under that with headroom for
// wider rows, while still cutting a 10k-row import from 10k round trips to ~10.
const CREATE_MANY_BATCH_SIZE = 1_000;

/**
 * Tenant-scoped Prisma adapter for employees. Every query filters by
 * `organisationId` from the TenantContext (never a caller argument) and reads/
 * writes through `prisma.activeClient` so writes join the caller's transaction.
 * Listing is index-backed and projects the current salary total via a single
 * join to `SalaryStructure` — no N+1.
 */
@Injectable()
export class PrismaEmployeeRepository extends EmployeeRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContext,
  ) {
    super();
  }

  async findPaged(query: EmployeeListQuery): Promise<PaginatedResult<EmployeeRowView>> {
    const where = this.listWhere(query);
    const [rows, total] = await Promise.all([
      this.prisma.activeClient.employee.findMany({
        where,
        orderBy: orderByOf(query.sort),
        skip: query.page.skip,
        take: query.page.take,
        include: this.rowInclude(),
      }),
      this.prisma.activeClient.employee.count({ where }),
    ]);
    return PaginatedResult.of(rows.map((row) => toRowView(row)), total, query.page);
  }

  async findById(id: string): Promise<EmployeeView | null> {
    const record = await this.prisma.activeClient.employee.findFirst({
      where: { id, organisationId: this.tenant.organisationId },
      include: {
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, name: true } },
        salaryStructure: { include: { components: true } },
      },
    });
    return record ? toDetailView(record) : null;
  }

  async findEntityById(id: string): Promise<Employee | null> {
    const record = await this.prisma.activeClient.employee.findFirst({
      where: { id, organisationId: this.tenant.organisationId },
    });
    return record ? toEntity(record) : null;
  }

  async create(employee: Employee): Promise<string> {
    const record = await this.prisma.activeClient.employee.create({
      data: { organisationId: this.tenant.organisationId, ...toData(employee) },
      select: { id: true },
    });
    return record.id;
  }

  async createMany(employees: readonly Employee[]): Promise<string[]> {
    const ids = employees.map(() => randomUUID());
    const rows = employees.map((employee, index) => ({
      id: ids[index],
      organisationId: this.tenant.organisationId,
      ...toData(employee),
    }));
    for (const batch of chunked(rows, CREATE_MANY_BATCH_SIZE)) {
      await this.prisma.activeClient.employee.createMany({ data: batch });
    }
    return ids;
  }

  async update(employee: Employee): Promise<void> {
    await this.prisma.activeClient.employee.updateMany({
      where: { id: employee.id ?? '', organisationId: this.tenant.organisationId },
      data: { ...toData(employee), status: employee.status },
    });
  }

  async existsByCode(employeeCode: string): Promise<boolean> {
    const record = await this.prisma.activeClient.employee.findFirst({
      where: { organisationId: this.tenant.organisationId, employeeCode },
      select: { id: true },
    });
    return record !== null;
  }

  private listWhere(query: EmployeeListQuery): Prisma.EmployeeWhereInput {
    return {
      organisationId: this.tenant.organisationId,
      ...filterWhere(query.filters),
      ...searchWhere(query.filters.search),
    };
  }

  private rowInclude(): Prisma.EmployeeInclude {
    return {
      department: { select: { name: true } },
      designation: { select: { name: true } },
      salaryStructure: { select: { totalMinor: true, currencyCode: true } },
    };
  }
}

function orderByOf(sort: EmployeeSort): Prisma.EmployeeOrderByWithRelationInput {
  if (sort.field === 'joinDate') {
    return { joinDate: sort.direction };
  }
  if (sort.field === 'salaryTotal') {
    return { salaryStructure: { totalMinor: sort.direction } };
  }
  return { lastName: sort.direction };
}

function filterWhere(filters: EmployeeListQuery['filters']): Prisma.EmployeeWhereInput {
  const where: Prisma.EmployeeWhereInput = {};
  if (filters.departmentId) where.departmentId = filters.departmentId;
  if (filters.designationId) where.designationId = filters.designationId;
  if (filters.countryCode) where.countryCode = filters.countryCode;
  if (isEmployeeStatus(filters.status)) where.status = filters.status;
  return where;
}

function searchWhere(search?: string): Prisma.EmployeeWhereInput {
  if (!search) {
    return {};
  }
  const contains = { contains: search, mode: 'insensitive' as const };
  return {
    OR: [{ firstName: contains }, { lastName: contains }, { employeeCode: contains }],
  };
}

function isEmployeeStatus(value?: string): value is EmployeeStatus {
  return value === EmployeeStatus.ACTIVE || value === EmployeeStatus.INACTIVE;
}

function toRowView(row: {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  countryCode: string;
  currencyCode: string;
  status: EmployeeStatus;
  joinDate: Date;
  department: { name: string };
  designation: { name: string };
  salaryStructure: StructureRow;
}): EmployeeRowView {
  return {
    id: row.id,
    employeeCode: row.employeeCode,
    firstName: row.firstName,
    lastName: row.lastName,
    department: row.department.name,
    designation: row.designation.name,
    country: row.countryCode,
    currency: row.currencyCode,
    status: row.status,
    joinDate: toIsoDate(row.joinDate),
    salaryTotalMinor: row.salaryStructure?.totalMinor ?? null,
  };
}

function toDetailView(record: {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  countryCode: string;
  currencyCode: string;
  status: EmployeeStatus;
  joinDate: Date;
  department: { id: string; name: string };
  designation: { id: string; name: string };
  salaryStructure:
    | { currencyCode: string; totalMinor: number; components: { type: string; amountMinor: number }[] }
    | null;
}): EmployeeView {
  return {
    id: record.id,
    employeeCode: record.employeeCode,
    firstName: record.firstName,
    lastName: record.lastName,
    department: record.department,
    designation: record.designation,
    countryCode: record.countryCode,
    currencyCode: record.currencyCode,
    status: record.status,
    joinDate: toIsoDate(record.joinDate),
    salary: toSalarySummary(record.salaryStructure),
  };
}

function toSalarySummary(
  structure:
    | { currencyCode: string; totalMinor: number; components: { type: string; amountMinor: number }[] }
    | null,
): SalarySummaryView | null {
  if (!structure) {
    return null;
  }
  return {
    currency: structure.currencyCode,
    totalMinor: structure.totalMinor,
    components: structure.components.map((component) => ({
      type: component.type as SalarySummaryView['components'][number]['type'],
      amountMinor: component.amountMinor,
    })),
  };
}

function toEntity(record: {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  departmentId: string;
  designationId: string;
  countryCode: string;
  currencyCode: string;
  joinDate: Date;
  status: EmployeeStatus;
}): Employee {
  return Employee.reconstitute(
    record.id,
    {
      employeeCode: record.employeeCode,
      firstName: record.firstName,
      lastName: record.lastName,
      departmentId: record.departmentId,
      designationId: record.designationId,
      countryCode: record.countryCode,
      currencyCode: record.currencyCode,
      joinDate: toIsoDate(record.joinDate),
    },
    record.status,
  );
}

function chunked<T>(items: readonly T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let start = 0; start < items.length; start += size) {
    batches.push(items.slice(start, start + size));
  }
  return batches;
}

function toData(employee: Employee) {
  return {
    employeeCode: employee.employeeCode,
    firstName: employee.firstName,
    lastName: employee.lastName,
    departmentId: employee.departmentId,
    designationId: employee.designationId,
    countryCode: employee.countryCode,
    currencyCode: employee.currencyCode,
    joinDate: new Date(employee.joinDate),
  };
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
