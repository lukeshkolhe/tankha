import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { transactionStorage } from './transaction-context';

/**
 * The single PrismaClient for the app, with Nest lifecycle hooks. Exported by
 * the @Global() platform module so every infrastructure adapter injects the
 * same connection pool.
 *
 * Wraps a PrismaClient by composition rather than `extends PrismaClient`.
 * Prisma's generated client constructor returns an internal Proxy; a subclass
 * getter that does `return this` resolves, through that proxy, to the raw
 * un-proxied target — which is missing the model delegates (`.department`,
 * `.employee`, …) that only exist on the outer proxy layer. Composition avoids
 * the pitfall entirely: `client` is a real, directly-constructed PrismaClient.
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly client = new PrismaClient();

  async onModuleInit(): Promise<void> {
    await this.client.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }

  /**
   * The client every repository adapter should read/write through: the ambient
   * transaction client when a UnitOfWork is active, otherwise the base client.
   * This is where tenant-transaction participation is enforced in infrastructure.
   */
  get activeClient(): Prisma.TransactionClient {
    return transactionStorage.getStore() ?? this.client;
  }

  /** Opens an interactive transaction on the base client (used by UnitOfWork). */
  transaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.client.$transaction(work);
  }
}
