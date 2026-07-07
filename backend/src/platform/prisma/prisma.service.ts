import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { transactionStorage } from './transaction-context';

/**
 * The single PrismaClient for the app, with Nest lifecycle hooks. Exported by
 * the @Global() platform module so every infrastructure adapter injects the
 * same connection pool. Transactions (`$transaction`) are used by every
 * multi-write use case to satisfy NFR-4.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /**
   * The client every repository adapter should read/write through: the ambient
   * transaction client when a UnitOfWork is active, otherwise this base client.
   * This is where tenant-transaction participation is enforced in infrastructure.
   */
  get activeClient(): Prisma.TransactionClient {
    return transactionStorage.getStore() ?? this;
  }
}
