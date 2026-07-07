import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/platform';
import { Email } from '../domain/email.vo';
import { User } from '../domain/user.entity';
import { NewUser, UserRepository } from '../domain/user.repository';

/** Row shape read back from Prisma for a user. */
interface UserRow {
  id: string;
  organisationId: string;
  email: string;
  name: string;
  passwordHash: string;
}

/**
 * Prisma adapter for UserRepository. Reads/writes through `prisma.activeClient`
 * so signup's insert joins the ambient UnitOfWork transaction. Email is a global
 * login identity, so lookups are not tenant-scoped (there is no tenant yet at
 * login), unlike the tenant-scoped adapters in other modules.
 */
@Injectable()
export class PrismaUserRepository extends UserRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByEmail(email: Email): Promise<User | null> {
    const row = await this.prisma.activeClient.user.findUnique({ where: { email: email.value } });
    return row ? this.toEntity(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.activeClient.user.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async create(user: NewUser): Promise<User> {
    const row = await this.prisma.activeClient.user.create({
      data: {
        organisationId: user.organisationId,
        email: user.email.value,
        name: user.name,
        passwordHash: user.passwordHash,
      },
    });
    return this.toEntity(row);
  }

  private toEntity(row: UserRow): User {
    return User.of(row.id, row.organisationId, Email.of(row.email), row.name, row.passwordHash);
  }
}
