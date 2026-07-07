import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/platform';
import {
  DEFAULT_DEPARTMENTS,
  DEFAULT_DESIGNATIONS,
  ReferenceSeeder,
} from '../domain/reference-seeder';

/**
 * Prisma adapter that seeds a new organisation's default departments and
 * designations. Writes through `prisma.activeClient` so the seeded rows commit
 * atomically with the organisation and owner user inside signup's transaction.
 */
@Injectable()
export class PrismaReferenceSeeder extends ReferenceSeeder {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async seedDefaults(organisationId: string): Promise<void> {
    await this.prisma.activeClient.department.createMany({
      data: DEFAULT_DEPARTMENTS.map((name) => ({ organisationId, name })),
    });
    await this.prisma.activeClient.designation.createMany({
      data: DEFAULT_DESIGNATIONS.map((name) => ({ organisationId, name })),
    });
  }
}
