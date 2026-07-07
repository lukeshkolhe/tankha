import { Injectable } from '@nestjs/common';
import { EmployeeStatus, Prisma } from '@prisma/client';
import { PrismaService, TenantContext } from 'src/platform';
import { SalaryComponentInput } from 'src/workforce/domain/employee-validation';
import { EmployeeListFilters } from 'src/workforce/domain/employee.repository';
import { EmployeeSort } from 'src/workforce/domain/employee-sort';
import {
  EmployeeSnapshot,
  EmployeeSnapshotRepository,
} from '../domain/employee-snapshot.repository';

const SNAPSHOT_INCLUDE = {
  department: { select: { name: true } },
  designation: { select: { name: true } },
  salaryStructure: { include: { components: true } },
} satisfies Prisma.EmployeeInclude;

type SnapshotRecord = Prisma.EmployeeGetPayload<{ include: typeof SNAPSHOT_INCLUDE }>;

/**
 * Tenant-scoped Prisma reads for data-exchange: the current-employee lookups
 * workforce's repository does not expose. `findByCodes` powers conflict diffs;
 * `findForExport` streams the filtered dataset. Every query filters by
 * `organisationId` from the TenantContext, never a caller argument.
 */
@Injectable()
export class PrismaImportRepository extends EmployeeSnapshotRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContext,
  ) {
    super();
  }

  async findByCodes(codes: string[]): Promise<Map<string, EmployeeSnapshot>> {
    const rows = await this.prisma.activeClient.employee.findMany({
      where: { organisationId: this.tenant.organisationId, employeeCode: { in: codes } },
      include: SNAPSHOT_INCLUDE,
    });
    return new Map(rows.map((row) => [row.employeeCode, toSnapshot(row)]));
  }

  async findForExport(
    filters: EmployeeListFilters,
    sort: EmployeeSort,
  ): Promise<EmployeeSnapshot[]> {
    const rows = await this.prisma.activeClient.employee.findMany({
      where: this.exportWhere(filters),
      orderBy: orderByOf(sort),
      include: SNAPSHOT_INCLUDE,
    });
    return rows.map(toSnapshot);
  }

  private exportWhere(filters: EmployeeListFilters): Prisma.EmployeeWhereInput {
    return {
      organisationId: this.tenant.organisationId,
      ...filterWhere(filters),
      ...searchWhere(filters.search),
    };
  }
}

function toSnapshot(row: SnapshotRecord): EmployeeSnapshot {
  return {
    id: row.id,
    employeeCode: row.employeeCode,
    firstName: row.firstName,
    lastName: row.lastName,
    department: row.department.name,
    designation: row.designation.name,
    country: row.countryCode,
    currency: row.currencyCode,
    joinDate: toIsoDate(row.joinDate),
    components: componentsOf(row),
    salaryTotalMinor: row.salaryStructure?.totalMinor ?? 0,
  };
}

function componentsOf(row: SnapshotRecord): SalaryComponentInput[] {
  return (row.salaryStructure?.components ?? []).map((component) => ({
    type: component.type,
    amountMinor: component.amountMinor,
  }));
}

function filterWhere(filters: EmployeeListFilters): Prisma.EmployeeWhereInput {
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
  return { OR: [{ firstName: contains }, { lastName: contains }, { employeeCode: contains }] };
}

function orderByOf(sort: EmployeeSort): Prisma.EmployeeOrderByWithRelationInput {
  if (sort.field === 'joinDate') return { joinDate: sort.direction };
  if (sort.field === 'salaryTotal') return { salaryStructure: { totalMinor: sort.direction } };
  return { lastName: sort.direction };
}

function isEmployeeStatus(value?: string): value is EmployeeStatus {
  return value === EmployeeStatus.ACTIVE || value === EmployeeStatus.INACTIVE;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
