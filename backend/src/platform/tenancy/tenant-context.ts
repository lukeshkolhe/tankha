import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { UnauthorizedError } from '../errors/domain-error';

/** The authenticated principal the JWT strategy attaches to each request. */
export interface AuthenticatedPrincipal {
  userId: string;
  organisationId: string;
  email: string;
}

/**
 * Request-scoped holder of the current tenant, populated from the validated JWT.
 * Every Prisma repository adapter reads `organisationId` from here and adds it to
 * its `where` clause — the central guarantee that no query crosses an
 * organisation boundary (FR-1.3). `organisationId` is never a caller-supplied
 * argument, so a controller cannot spoof it.
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantContext {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  get userId(): string {
    return this.principal().userId;
  }

  get organisationId(): string {
    return this.principal().organisationId;
  }

  private principal(): AuthenticatedPrincipal {
    const principal = (this.request as Request & { user?: AuthenticatedPrincipal }).user;
    if (!principal) {
      throw new UnauthorizedError('No authenticated tenant on this request.');
    }
    return principal;
  }
}
