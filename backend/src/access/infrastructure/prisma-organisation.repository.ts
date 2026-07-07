import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/platform';
import { Organisation } from '../domain/organisation.entity';
import { OrganisationRepository } from '../domain/organisation.repository';

/**
 * Prisma adapter for OrganisationRepository. Writes through `prisma.activeClient`
 * so the organisation insert joins signup's ambient UnitOfWork transaction.
 */
@Injectable()
export class PrismaOrganisationRepository extends OrganisationRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(name: string): Promise<Organisation> {
    const row = await this.prisma.activeClient.organisation.create({ data: { name } });
    return Organisation.of(row.id, row.name);
  }

  async findById(id: string): Promise<Organisation | null> {
    const row = await this.prisma.activeClient.organisation.findUnique({ where: { id } });
    return row ? Organisation.of(row.id, row.name) : null;
  }
}
