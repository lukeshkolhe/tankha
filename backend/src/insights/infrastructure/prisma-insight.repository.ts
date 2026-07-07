import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService, TenantContext } from 'src/platform';
import { InsightRepository, InsightsFilter } from '../domain/insight.repository';
import { CurrencyAggregate } from '../domain/pay-insight';
import { DimensionAggregate } from '../domain/breakdown';

/** One raw row from a joined `GROUP BY dimension, currency` query. */
interface RawDimensionRow {
  dimension: string;
  currency: string;
  headcount: bigint;
  totalMinor: bigint | null;
}

/**
 * Tenant-scoped, read-only aggregation adapter. Grouping happens in Postgres:
 * `groupBy` for the currency overview, and a joined `GROUP BY` for the dimension
 * breakdowns. Every query is filtered by `organisationId` from the TenantContext
 * — never a caller argument. Monetary sums are ALWAYS grouped by `currencyCode`,
 * so no cross-currency total can be produced.
 */
@Injectable()
export class PrismaInsightRepository extends InsightRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContext,
  ) {
    super();
  }

  async overview(filter: InsightsFilter): Promise<CurrencyAggregate[]> {
    const groups = await this.prisma.activeClient.salaryStructure.groupBy({
      by: ['currencyCode'],
      where: this.structureWhere(filter),
      _sum: { totalMinor: true },
      _count: { _all: true },
    });
    return groups.map((group) => ({
      currency: group.currencyCode,
      headcount: group._count._all,
      totalMinor: group._sum.totalMinor ?? 0,
    }));
  }

  byDepartment(filter: InsightsFilter): Promise<DimensionAggregate[]> {
    return this.breakdown(filter, Prisma.sql`"Department" dim ON dim.id = e."departmentId"`);
  }

  byCountry(filter: InsightsFilter): Promise<DimensionAggregate[]> {
    return this.breakdown(filter, Prisma.sql`"Country" dim ON dim.code = e."countryCode"`);
  }

  private async breakdown(filter: InsightsFilter, dimension: Prisma.Sql): Promise<DimensionAggregate[]> {
    const rows = await this.prisma.activeClient.$queryRaw<RawDimensionRow[]>`
      SELECT dim.name AS dimension, s."currencyCode" AS currency,
             COUNT(*) AS headcount, SUM(s."totalMinor") AS "totalMinor"
      FROM "SalaryStructure" s
      JOIN "Employee" e ON e.id = s."employeeId"
      JOIN ${dimension}
      WHERE ${this.whereClause(filter)}
      GROUP BY dim.name, s."currencyCode"`;
    return rows.map((row) => this.toDimensionAggregate(row));
  }

  private toDimensionAggregate(row: RawDimensionRow): DimensionAggregate {
    return {
      dimension: row.dimension,
      currency: row.currency,
      headcount: Number(row.headcount),
      totalMinor: Number(row.totalMinor ?? 0),
    };
  }

  private structureWhere(filter: InsightsFilter): Prisma.SalaryStructureWhereInput {
    return {
      organisationId: this.tenant.organisationId,
      employee: this.employeeWhere(filter),
    };
  }

  private employeeWhere(filter: InsightsFilter): Prisma.EmployeeWhereInput {
    return {
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.department ? { departmentId: filter.department } : {}),
      ...(filter.country ? { countryCode: filter.country } : {}),
      ...(filter.search ? { OR: this.searchOr(filter.search) } : {}),
    };
  }

  private searchOr(search: string): Prisma.EmployeeWhereInput[] {
    const match = { contains: search, mode: 'insensitive' as const };
    return [{ firstName: match }, { lastName: match }, { employeeCode: match }];
  }

  private whereClause(filter: InsightsFilter): Prisma.Sql {
    return Prisma.join(this.conditions(filter), ' AND ');
  }

  private conditions(filter: InsightsFilter): Prisma.Sql[] {
    const conditions = [Prisma.sql`s."organisationId" = ${this.tenant.organisationId}`];
    this.pushEmployeeConditions(conditions, filter);
    return conditions;
  }

  private pushEmployeeConditions(conditions: Prisma.Sql[], filter: InsightsFilter): void {
    if (filter.status) {
      conditions.push(Prisma.sql`e."status" = ${filter.status}::"EmployeeStatus"`);
    }
    if (filter.department) {
      conditions.push(Prisma.sql`e."departmentId" = ${filter.department}`);
    }
    if (filter.country) {
      conditions.push(Prisma.sql`e."countryCode" = ${filter.country}`);
    }
    if (filter.search) {
      conditions.push(this.searchCondition(filter.search));
    }
  }

  private searchCondition(search: string): Prisma.Sql {
    const like = `%${search}%`;
    return Prisma.sql`(e."firstName" ILIKE ${like} OR e."lastName" ILIKE ${like} OR e."employeeCode" ILIKE ${like})`;
  }
}
