import { AsyncLocalStorage } from 'node:async_hooks';
import { Prisma } from '@prisma/client';

/**
 * Ambient transaction store. When a UnitOfWork is running, the active Prisma
 * transaction client is held here so every repository adapter transparently
 * joins the same transaction — including across bounded contexts (workforce's
 * create-employee delegating to compensation) — without passing a `tx` handle
 * through the application layer or leaking Prisma into use cases.
 */
export const transactionStorage = new AsyncLocalStorage<Prisma.TransactionClient>();
