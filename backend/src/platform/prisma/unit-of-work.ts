import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { transactionStorage } from './transaction-context';

/**
 * Application-facing port for atomic multi-write operations. A use case wraps its
 * writes in `run(...)`; everything inside either all commits or all rolls back
 * (NFR-4). Application/domain code depends on this interface, never on Prisma —
 * unit tests provide a trivial fake that just invokes the callback.
 */
export abstract class UnitOfWork {
  abstract run<T>(work: () => Promise<T>): Promise<T>;
}

/** Prisma-backed UnitOfWork: opens an interactive transaction and publishes the
 * tx client into the ambient store so adapters transparently join it. */
@Injectable()
export class PrismaUnitOfWork extends UnitOfWork {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  run<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction((tx) =>
      transactionStorage.run(tx as Prisma.TransactionClient, work),
    );
  }
}
