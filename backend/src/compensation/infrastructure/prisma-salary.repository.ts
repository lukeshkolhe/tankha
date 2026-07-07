import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PageRequest, PaginatedResult, PrismaService, TenantContext } from 'src/platform';
import { SalaryRepository } from '../domain/salary.repository';
import { SalaryStructure } from '../domain/salary-structure.entity';
import { SalaryComponent } from '../domain/salary-component.vo';
import { SalaryRevision } from '../domain/salary-revision.entity';
import { RevisionView, SalaryComponentData, SalaryView } from '../domain/read-models';

/**
 * Tenant-scoped Prisma adapter. Reads/writes through `prisma.activeClient` so
 * every operation joins the caller's ambient transaction. Every query filters by
 * `organisationId` from the TenantContext — never a caller argument.
 */
@Injectable()
export class PrismaSalaryRepository extends SalaryRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContext,
  ) {
    super();
  }

  async findStructureByEmployee(employeeId: string): Promise<SalaryStructure | null> {
    const record = await this.prisma.activeClient.salaryStructure.findFirst({
      where: { employeeId, organisationId: this.tenant.organisationId },
      include: { components: true },
    });
    if (!record) {
      return null;
    }
    const components = record.components.map((component) =>
      SalaryComponent.of(component.type, component.amountMinor, record.currencyCode),
    );
    return SalaryStructure.create(employeeId, record.organisationId, record.currencyCode, components);
  }

  async getCurrentSalary(employeeId: string): Promise<SalaryView | null> {
    const record = await this.prisma.activeClient.salaryStructure.findFirst({
      where: { employeeId, organisationId: this.tenant.organisationId },
      include: { components: true },
    });
    if (!record) {
      return null;
    }
    return {
      employeeId,
      currency: record.currencyCode,
      components: record.components.map((component) => ({
        type: component.type,
        amountMinor: component.amountMinor,
      })),
      totalMinor: record.totalMinor,
    };
  }

  async saveInitial(structure: SalaryStructure, revision: SalaryRevision): Promise<void> {
    await this.prisma.activeClient.salaryStructure.create({
      data: {
        employeeId: structure.employeeId,
        organisationId: structure.organisationId,
        currencyCode: structure.currencyCode,
        totalMinor: structure.totalMinor,
        components: { create: this.componentRows(structure) },
      },
    });
    await this.insertRevision(revision);
  }

  async replaceStructure(structure: SalaryStructure, revision: SalaryRevision): Promise<void> {
    const existing = await this.prisma.activeClient.salaryStructure.findFirst({
      where: { employeeId: structure.employeeId, organisationId: this.tenant.organisationId },
      select: { id: true },
    });
    if (!existing) {
      return;
    }
    await this.prisma.activeClient.salaryComponent.deleteMany({
      where: { salaryStructureId: existing.id },
    });
    await this.prisma.activeClient.salaryStructure.update({
      where: { id: existing.id },
      data: { totalMinor: structure.totalMinor, components: { create: this.componentRows(structure) } },
    });
    await this.insertRevision(revision);
  }

  async listRevisions(
    employeeId: string,
    page: PageRequest,
  ): Promise<PaginatedResult<RevisionView>> {
    const where = { employeeId, organisationId: this.tenant.organisationId };
    const [rows, total] = await Promise.all([
      this.prisma.activeClient.salaryRevision.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: page.skip,
        take: page.take,
        include: { changedBy: { select: { id: true, name: true } } },
      }),
      this.prisma.activeClient.salaryRevision.count({ where }),
    ]);
    return PaginatedResult.of(rows.map((row) => this.toRevisionView(row)), total, page);
  }

  private componentRows(structure: SalaryStructure): SalaryComponentData[] {
    return structure.components.map((component) => ({
      type: component.type,
      amountMinor: component.amountMinor,
    }));
  }

  private async insertRevision(revision: SalaryRevision): Promise<void> {
    await this.prisma.activeClient.salaryRevision.create({
      data: {
        employeeId: revision.employeeId,
        organisationId: revision.organisationId,
        currencyCode: revision.currencyCode,
        oldTotalMinor: revision.oldTotalMinor,
        newTotalMinor: revision.newTotalMinor,
        componentsSnapshot: revision.componentsSnapshot as unknown as Prisma.InputJsonValue,
        remark: revision.remark,
        changedByUserId: revision.changedByUserId,
      },
    });
  }

  private toRevisionView(row: {
    id: string;
    oldTotalMinor: number | null;
    newTotalMinor: number;
    currencyCode: string;
    remark: string;
    createdAt: Date;
    componentsSnapshot: Prisma.JsonValue;
    changedBy: { id: string; name: string };
  }): RevisionView {
    return {
      id: row.id,
      oldTotalMinor: row.oldTotalMinor,
      newTotalMinor: row.newTotalMinor,
      currency: row.currencyCode,
      remark: row.remark,
      changedBy: row.changedBy,
      createdAt: row.createdAt.toISOString(),
      componentsSnapshot: row.componentsSnapshot as unknown as SalaryComponentData[],
    };
  }
}
