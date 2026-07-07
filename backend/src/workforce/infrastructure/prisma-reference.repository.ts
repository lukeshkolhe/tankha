import { Injectable } from '@nestjs/common';
import { PrismaService, TenantContext } from 'src/platform';
import {
  CountryItem,
  CurrencyItem,
  ReferenceItem,
  ReferenceRepository,
  ValidReferences,
} from '../domain/reference.repository';

/**
 * Tenant-scoped Prisma adapter for reference data. Departments and designations
 * are scoped to the current organisation via TenantContext; countries and
 * currencies are global ISO lists. `loadValidReferences` reads only the keys
 * needed for validation, in four small queries.
 */
@Injectable()
export class PrismaReferenceRepository extends ReferenceRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContext,
  ) {
    super();
  }

  listDepartments(): Promise<ReferenceItem[]> {
    return this.prisma.activeClient.department.findMany({
      where: { organisationId: this.tenant.organisationId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  listDesignations(): Promise<ReferenceItem[]> {
    return this.prisma.activeClient.designation.findMany({
      where: { organisationId: this.tenant.organisationId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  listCountries(): Promise<CountryItem[]> {
    return this.prisma.activeClient.country.findMany({
      select: { code: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  listCurrencies(): Promise<CurrencyItem[]> {
    return this.prisma.activeClient.currency.findMany({
      select: { code: true, name: true, symbol: true, minorUnitDigits: true },
      orderBy: { code: 'asc' },
    });
  }

  async loadValidReferences(): Promise<ValidReferences> {
    const [departments, designations, countries, currencies] = await Promise.all([
      this.departmentIds(),
      this.designationIds(),
      this.countryCodes(),
      this.currencyCodes(),
    ]);
    return { departmentIds: departments, designationIds: designations, countryCodes: countries, currencyCodes: currencies };
  }

  private async departmentIds(): Promise<Set<string>> {
    const rows = await this.prisma.activeClient.department.findMany({
      where: { organisationId: this.tenant.organisationId },
      select: { id: true },
    });
    return new Set(rows.map((row) => row.id));
  }

  private async designationIds(): Promise<Set<string>> {
    const rows = await this.prisma.activeClient.designation.findMany({
      where: { organisationId: this.tenant.organisationId },
      select: { id: true },
    });
    return new Set(rows.map((row) => row.id));
  }

  private async countryCodes(): Promise<Set<string>> {
    const rows = await this.prisma.activeClient.country.findMany({ select: { code: true } });
    return new Set(rows.map((row) => row.code));
  }

  private async currencyCodes(): Promise<Set<string>> {
    const rows = await this.prisma.activeClient.currency.findMany({ select: { code: true } });
    return new Set(rows.map((row) => row.code));
  }
}
